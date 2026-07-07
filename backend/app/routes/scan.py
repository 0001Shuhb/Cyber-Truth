# app/routes/scan.py
"""
Scan endpoints — the core of PhishGuard.

POST /api/scan/url      — Analyze a URL for phishing indicators
POST /api/scan/email    — Analyze email content with NLP
POST /api/scan/website  — Deep-scan a website (SSL + DOM + WHOIS)
GET  /api/scan/history  — Paginated scan history for current user
GET  /api/scan/<id>     — Single scan result (full detail)
DELETE /api/scan/<id>   — Delete a scan record

PERFORMANCE NOTES:
URL scans: ~500-1500ms (WHOIS + SSL + ML inference)
Email scans: ~200-800ms (NLP is CPU-bound but fast)
Website scans: ~2000-5000ms (fetching + parsing the live page)

For website scans, consider Celery for async processing.
The endpoint would return a task_id immediately, and the
frontend would poll GET /api/scan/<task_id>/status.
"""

import time
import io
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from werkzeug.utils import secure_filename

from ..extensions import db, limiter
from ..models.user import User
from ..models.scan import Scan
from ..utils.response import success_response, error_response, validation_error_response
from ..utils.validators import URLScanSchema, EmailScanSchema, WebsiteScanSchema
from ..utils.security import sanitize_url, sanitize_string, get_client_ip, is_internal_url, is_valid_url

scan_bp = Blueprint('scan', __name__)

url_scan_schema     = URLScanSchema()
email_scan_schema   = EmailScanSchema()
website_scan_schema = WebsiteScanSchema()


def _save_scan(user_id: str, scan_type: str, input_data: str,
               result: dict, duration_ms: int) -> Scan:
    """
    Helper: persist a scan result to the database.

    Extracted to a helper to avoid repeating the same ORM code
    in three different scan endpoints.
    """
    scan = Scan(
        user_id        = user_id,
        scan_type      = scan_type,
        input_data     = input_data,
        risk_score     = result['risk_score'],       # 0.0 – 1.0
        risk_label     = result['risk_label'],       # 'safe'/'suspicious'/'phishing'
        indicators     = result.get('indicators', []),
        ai_analysis    = result.get('ai_analysis', ''),
        raw_features   = result.get('features', {}),
        model_version  = result.get('model_version', '1.0.0'),
        scan_duration_ms = duration_ms,
        ip_address     = get_client_ip(),
    )
    db.session.add(scan)

    # Increment user's scan counter (denormalized for fast dashboard queries)
    user = User.query.get(user_id)
    if user:
        user.scan_count += 1

    db.session.commit()
    return scan


@scan_bp.route('/url', methods=['POST'])
@jwt_required()
@limiter.limit('100 per hour; 20 per minute')
def scan_url():
    """
    POST /api/scan/url

    Extract 28 features from a URL, run through the ML classifier,
    enrich with WHOIS/SSL data, generate AI narrative.

    Request body:
        url (str, required) — the URL to analyze

    Returns:
        200: Full scan result with risk score, indicators, AI analysis
        422: Invalid URL format
        400: URL validation failed (SSRF protection, etc.)
    """
    # ==================================================
    # 1. Parse + Validate Request
    # ==================================================
    try:
        data = request.get_json(silent=True) or {}
        validated = url_scan_schema.load(data)
    except ValidationError as e:
        return validation_error_response(e.messages)

    url = sanitize_url(validated['url'])

    # ==================================================
    # 2. Security Checks (SSRF Protection)
    # ==================================================
    if not is_valid_url(url):
        return error_response('INVALID_URL', 'The provided URL is not a valid HTTP/HTTPS URL.', status_code=422)

    if is_internal_url(url):
        # Log this — it's likely an SSRF attempt, not an accident
        current_app.logger.warning(
            f'SSRF attempt blocked: {url} — IP: {get_client_ip()}'
        )
        return error_response(
            'SSRF_BLOCKED',
            'Scanning internal/private network addresses is not permitted.',
            status_code=403
        )

    # ==================================================
    # 3. Run the Analysis Pipeline
    # ==================================================
    user_id = get_jwt_identity()
    start_time = time.time()

    try:
        # Import services here (lazy import) to avoid circular dependencies
        # and to make it easy to mock in tests
        from ..services.url_analyzer import URLAnalyzer
        from ..services.ml_engine import MLEngine

        analyzer = URLAnalyzer()
        ml_engine = MLEngine()

        # Step 1: Extract URL features (fast, no network calls)
        features = analyzer.extract_features(url)
        t_features = time.time()

        # Step 2: Enrich with WHOIS + SSL (network calls, uses cache)
        enriched = analyzer.enrich_with_threat_intel(url, features)
        t_enriched = time.time()

        # Step 3: ML inference
        prediction = ml_engine.predict_url(enriched)
        t_prediction = time.time()

        # Step 4: Generate human-readable indicators
        indicators = analyzer.generate_indicators(enriched, prediction)
        t_indicators = time.time()

        # Step 5: AI narrative will be generated asynchronously by Celery.
        # We set ai_analysis to None for now and persist the Scan first,
        # then enqueue a background task that will update the Scan record.
        ai_analysis = None
        ai_task_id = None
        t_ai = time.time()

        result = {
            'risk_score':    prediction['probability'],  # 0.0 – 1.0
            'risk_label':    prediction['label'],
            'features':      enriched,
            'indicators':    indicators,
            'ai_analysis':   ai_analysis,
            'ai_task_id':    ai_task_id,
            'model_version': ml_engine.version,
        }

    except Exception as e:
        current_app.logger.error(f'URL scan failed for {url}: {e}')
        return error_response(
            'SCAN_FAILED',
            'Analysis failed. The URL may be unreachable.',
            status_code=500
        )

    duration_ms = int((time.time() - start_time) * 1000)

    # Build per-step timings (ms). Only include when diagnostics enabled.
    timings_ms = {
        'features':   int((t_features - start_time) * 1000),
        'enrich':     int((t_enriched - t_features) * 1000),
        'prediction': int((t_prediction - t_enriched) * 1000),
        'indicators': int((t_indicators - t_prediction) * 1000),
        'ai_analysis':int((t_ai - t_indicators) * 1000),
        'total':      duration_ms,
    }
    # Log timings for diagnostics/metrics
    current_app.logger.info(
        f"URL scan timings_ms={timings_ms} url={url} user_id={user_id}"
    )

    # ==================================================
    # 4. Persist Result
    # ==================================================
    scan = _save_scan(user_id, 'url', url, result, duration_ms)

    # Enqueue AI narration — fall back to sync if Celery not configured
    ai_task_id = None
    try:
        if hasattr(current_app, 'celery') and current_app.celery:
            res = current_app.celery.send_task('tasks.generate_url_narrative', args=[scan.id, prediction, indicators])
            ai_task_id = getattr(res, 'id', None)
        else:
            raise RuntimeError('celery not configured')
    except Exception:
        try:
            from ..services.ai_narrator import generate_url_narrative
            scan.ai_analysis = generate_url_narrative(url, prediction, indicators)
            db.session.add(scan)
            db.session.commit()
            ai_analysis = scan.ai_analysis
        except Exception as e2:
            current_app.logger.error(f'AI narration failed for scan={scan.id}: {e2}')

    # ==================================================
    # 5. Return Full Result
    # ==================================================
    return success_response(
        data={
            'scan':          scan.to_dict(full=True),
            'risk_score':    round(prediction['probability'] * 100, 1),
            'risk_label':    prediction['label'],
            'features':      enriched,
            'indicators':    indicators,
            'ai_analysis':   ai_analysis,
            'ai_task_id':    ai_task_id,
            'scan_duration': duration_ms,
            **({'timings_ms': timings_ms} if (request.args.get('diagnose') == '1' or current_app.config.get('DEBUG')) else {}),
        },
        message=f'URL analysis complete. Verdict: {prediction["label"].upper()}'
    )


@scan_bp.route('/email', methods=['POST'])
@jwt_required()
@limiter.limit('50 per hour; 10 per minute')
def scan_email():
    """
    POST /api/scan/email

    Run NLP analysis on email content:
    - Extract urgency signals
    - Detect sender spoofing patterns
    - Find and scan embedded URLs
    - Classify with trained email model
    - Return safe indicators + recommended actions

    Request body:
        content (str, required) — raw email text (headers + body)
    """
    try:
        data = request.get_json(silent=True) or {}
        validated = email_scan_schema.load(data)
    except ValidationError as e:
        return validation_error_response(e.messages)

    content  = sanitize_string(validated['content'], max_length=50000)
    user_id  = get_jwt_identity()
    start_time = time.time()

    try:
        from ..services.email_analyzer import EmailAnalyzer
        from ..services.ml_engine import MLEngine

        analyzer  = EmailAnalyzer()
        ml_engine = MLEngine()

        features   = analyzer.extract_features(content)
        t_features = time.time()

        prediction = ml_engine.predict_email(features)
        t_prediction = time.time()

        indicators      = analyzer.generate_indicators(features, prediction)
        safe_indicators = analyzer.get_safe_indicators(features)
        t_indicators = time.time()

        ai_analysis = None
        ai_task_id = None
        t_ai = time.time()

        result = {
            'risk_score':       prediction['probability'],
            'risk_label':       prediction['label'],
            'features':         features,
            'indicators':       indicators,
            'safe_indicators':  safe_indicators,
            'ai_analysis':      None,
            'ai_task_id':       None,
        }

    except Exception as e:
        current_app.logger.error(f'Email scan failed: {e}')
        return error_response('SCAN_FAILED', 'Email analysis failed.', status_code=500)

    duration_ms = int((time.time() - start_time) * 1000)
    timings_ms = {
        'features':   int((t_features - start_time) * 1000),
        'prediction': int((t_prediction - t_features) * 1000),
        'indicators': int((t_indicators - t_prediction) * 1000),
        'ai_analysis':int((t_ai - t_indicators) * 1000),
        'total':      duration_ms,
    }
    current_app.logger.info(
        f"Email scan timings_ms={timings_ms} content_len={len(content)} user_id={user_id}"
    )

    scan = _save_scan(user_id, 'email', content[:200], result, duration_ms)

    # Enqueue AI narrative — fall back to sync if Celery not configured
    ai_task_id = None
    try:
        if hasattr(current_app, 'celery') and current_app.celery:
            res = current_app.celery.send_task('tasks.generate_email_narrative', args=[scan.id, content[:500], prediction, indicators])
            ai_task_id = getattr(res, 'id', None)
        else:
            raise RuntimeError('celery not configured')
    except Exception:
        try:
            from ..services.ai_narrator import generate_email_narrative
            scan.ai_analysis = generate_email_narrative(content[:200], prediction, indicators)
            db.session.add(scan)
            db.session.commit()
        except Exception as e2:
            current_app.logger.error(f'AI narration failed for scan={scan.id}: {e2}')

    recommended_actions = []
    try:
        from ..services.email_analyzer import EmailAnalyzer as EA
        recommended_actions = EA().get_recommended_actions(prediction['label'], features)
    except Exception:
        pass

    return success_response(
        data={
            'scan':               scan.to_dict(full=True),
            'risk_score':         round(prediction['probability'] * 100, 1),
            'risk_label':         prediction['label'],
            'features':           features,
            'indicators':         indicators,
            'safe_indicators':    safe_indicators,
            'recommended_actions':recommended_actions,
            'ai_analysis':        None,
            'ai_task_id':         ai_task_id,
            **({'timings_ms': timings_ms} if (request.args.get('diagnose') == '1' or current_app.config.get('DEBUG')) else {}),
        },
        message=f'Email analysis complete. Verdict: {prediction["label"].upper()}'
    )


@scan_bp.route('/email/file', methods=['POST'])
@jwt_required()
@limiter.limit('20 per hour; 5 per minute')
def scan_email_file():
    """
    POST /api/scan/email/file

    Upload a .eml file for phishing analysis.
    Uses multipart/form-data with field name 'file'.

    Security:
    - Max file size: 5MB
    - Allowed types: message/rfc822, text/plain
    - Content sanitized; not stored permanently
    """
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return error_response('NO_FILE', 'No file uploaded. Use field name "file".', status_code=400)

    f = request.files['file']
    if not f or not f.filename:
        return error_response('EMPTY_FILE', 'Uploaded file is empty.', status_code=400)

    filename = secure_filename(f.filename)
    allowed_exts = {'.eml', '.txt', '.msg'}
    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in allowed_exts:
        return error_response(
            'INVALID_FILE_TYPE',
            f'Only .eml, .txt, and .msg files are accepted. Got: {ext}',
            status_code=422
        )

    raw_bytes = f.read(5 * 1024 * 1024 + 1)  # read up to 5MB+1 to detect oversize
    if len(raw_bytes) > 5 * 1024 * 1024:
        return error_response('FILE_TOO_LARGE', 'File exceeds 5MB limit.', status_code=413)

    start_time = time.time()
    try:
        from ..services.email_analyzer import EmailAnalyzer
        from ..services.ml_engine import MLEngine

        analyzer  = EmailAnalyzer()
        ml_engine = MLEngine()

        parsed = analyzer.parse_eml(raw_bytes)
        content = parsed['text']
        attachments = parsed.get('attachments', [])
        headers = parsed.get('headers', {})

        features = analyzer.extract_features(content, attachments=attachments, headers=headers)
        prediction = ml_engine.predict_email(features)
        indicators = analyzer.generate_indicators(features, prediction)
        safe_indicators = analyzer.get_safe_indicators(features)
        recommended_actions = analyzer.get_recommended_actions(prediction['label'], features)

        result = {
            'risk_score':    prediction['probability'],
            'risk_label':    prediction['label'],
            'features':      features,
            'indicators':    indicators,
            'safe_indicators': safe_indicators,
            'ai_analysis':   None,
        }

    except Exception as e:
        current_app.logger.error(f'Email file scan failed: {e}')
        return error_response('SCAN_FAILED', f'Email file analysis failed: {str(e)}', status_code=500)

    duration_ms = int((time.time() - start_time) * 1000)
    # Store only filename + brief summary, not the full email content
    scan = _save_scan(user_id, 'email', f'[FILE: {filename}] ' + content[:150], result, duration_ms)

    return success_response(
        data={
            'scan':               scan.to_dict(full=True),
            'risk_score':         round(prediction['probability'] * 100, 1),
            'risk_label':         prediction['label'],
            'features':           features,
            'indicators':         indicators,
            'safe_indicators':    safe_indicators,
            'recommended_actions':recommended_actions,
            'ai_analysis':        None,
            'filename':           filename,
        },
        message=f'Email file analysis complete. Verdict: {prediction["label"].upper()}'
    )


@scan_bp.route('/email/image', methods=['POST'])
@jwt_required()
@limiter.limit('10 per hour; 3 per minute')
def scan_email_image():
    """
    POST /api/scan/email/image

    Upload a screenshot of an email (PNG/JPG/WEBP) for analysis.
    Attempts OCR via Pillow. If tesseract is unavailable, analyzes
    image metadata and returns best-effort result.

    Security:
    - Max file size: 10MB
    - Allowed types: image/png, image/jpeg, image/webp
    - Image never stored; discarded after analysis
    """
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return error_response('NO_FILE', 'No image uploaded. Use field name "file".', status_code=400)

    f = request.files['file']
    if not f or not f.filename:
        return error_response('EMPTY_FILE', 'Uploaded file is empty.', status_code=400)

    filename = secure_filename(f.filename)
    allowed_exts = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'}
    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in allowed_exts:
        return error_response(
            'INVALID_FILE_TYPE',
            f'Only image files (PNG, JPG, WEBP) are accepted. Got: {ext}',
            status_code=422
        )

    raw_bytes = f.read(10 * 1024 * 1024 + 1)
    if len(raw_bytes) > 10 * 1024 * 1024:
        return error_response('FILE_TOO_LARGE', 'Image exceeds 10MB limit.', status_code=413)

    start_time = time.time()
    extracted_text = ''
    ocr_available = False

    # Try OCR with pytesseract if available
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(io.BytesIO(raw_bytes))
        extracted_text = pytesseract.image_to_string(img)
        ocr_available = True
    except ImportError:
        # pytesseract not installed — use Pillow only for basic metadata
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(raw_bytes))
            extracted_text = f'[Screenshot: {img.size[0]}x{img.size[1]}px {img.mode}]'
        except Exception:
            extracted_text = '[Image could not be processed]'
    except Exception as e:
        current_app.logger.warning(f'OCR failed: {e}')
        extracted_text = '[OCR failed — could not extract text from image]'

    if not extracted_text.strip() or len(extracted_text.strip()) < 5:
        extracted_text = '[No readable text extracted from screenshot]'

    try:
        from ..services.email_analyzer import EmailAnalyzer
        from ..services.ml_engine import MLEngine

        analyzer  = EmailAnalyzer()
        ml_engine = MLEngine()

        features = analyzer.extract_features(extracted_text)
        prediction = ml_engine.predict_email(features)
        indicators = analyzer.generate_indicators(features, prediction)
        safe_indicators = analyzer.get_safe_indicators(features)
        recommended_actions = analyzer.get_recommended_actions(prediction['label'], features)

        result = {
            'risk_score':    prediction['probability'],
            'risk_label':    prediction['label'],
            'features':      features,
            'indicators':    indicators,
            'safe_indicators': safe_indicators,
            'ai_analysis':   None,
        }

    except Exception as e:
        current_app.logger.error(f'Email image scan failed: {e}')
        return error_response('SCAN_FAILED', f'Image analysis failed: {str(e)}', status_code=500)

    duration_ms = int((time.time() - start_time) * 1000)
    scan = _save_scan(user_id, 'email', f'[SCREENSHOT: {filename}] ' + extracted_text[:150], result, duration_ms)

    return success_response(
        data={
            'scan':               scan.to_dict(full=True),
            'risk_score':         round(prediction['probability'] * 100, 1),
            'risk_label':         prediction['label'],
            'features':           features,
            'indicators':         indicators,
            'safe_indicators':    safe_indicators,
            'recommended_actions':recommended_actions,
            'extracted_text':     extracted_text[:500],
            'ocr_available':      ocr_available,
            'ai_analysis':        None,
            'filename':           filename,
        },
        message=f'Screenshot analysis complete. Verdict: {prediction["label"].upper()}'
    )



@scan_bp.route('/website', methods=['POST'])
@jwt_required()
@limiter.limit('20 per hour; 5 per minute')  # Lower limit — expensive operation
def scan_website():
    """
    POST /api/scan/website

    Full website scan: fetch the page, analyze DOM structure,
    check SSL configuration, follow redirect chains, detect
    credential harvesting forms and malicious scripts.
    """
    try:
        data = request.get_json(silent=True) or {}
        validated = website_scan_schema.load(data)
    except ValidationError as e:
        return validation_error_response(e.messages)

    url = sanitize_url(validated['url'])

    if not is_valid_url(url) or is_internal_url(url):
        return error_response('INVALID_URL', 'Invalid or blocked URL.', status_code=422)

    user_id    = get_jwt_identity()
    start_time = time.time()

    try:
        from ..services.website_scanner import WebsiteScanner
        from ..services.ssl_service import SSLService

        scanner     = WebsiteScanner()
        ssl_service = SSLService()

        # Fetch and analyze the page
        page_analysis = scanner.analyze(url)
        t_page = time.time()

        # Check SSL configuration
        ssl_report = ssl_service.check(url)
        t_ssl = time.time()

        features = {**page_analysis, 'ssl': ssl_report}

        # Score based on combined features
        from ..services.ml_engine import MLEngine
        ml_engine = MLEngine()
        prediction = ml_engine.predict_website(features)
        t_prediction = time.time()

        indicators = scanner.generate_indicators(features, prediction)
        t_indicators = time.time()

        # AI narrative will be generated asynchronously; persist Scan first.
        ai_analysis = None
        ai_task_id = None
        t_ai = time.time()

        result = {
            'risk_score':  prediction['probability'],
            'risk_label':  prediction['label'],
            'features':    features,
            'indicators':  indicators,
            'ai_analysis': None,
            'ai_task_id':  None,
        }

    except Exception as e:
        current_app.logger.error(f'Website scan failed for {url}: {e}')
        return error_response('SCAN_FAILED', 'Website scan failed. The site may be unreachable.', status_code=500)

    duration_ms = int((time.time() - start_time) * 1000)
    timings_ms = {
        'page_fetch': int((t_page - start_time) * 1000),
        'ssl_check':  int((t_ssl - t_page) * 1000),
        'prediction': int((t_prediction - t_ssl) * 1000),
        'indicators': int((t_indicators - t_prediction) * 1000),
        'ai_analysis':int((t_ai - t_indicators) * 1000),
        'total':      duration_ms,
    }
    current_app.logger.info(
        f"Website scan timings_ms={timings_ms} url={url} user_id={user_id}"
    )

    scan = _save_scan(user_id, 'website', url, result, duration_ms)

    # Enqueue website AI narrative — fall back to sync if Celery not configured
    ai_task_id = None
    try:
        if hasattr(current_app, 'celery') and current_app.celery:
            res = current_app.celery.send_task('tasks.generate_website_narrative', args=[scan.id, features, prediction, indicators])
            ai_task_id = getattr(res, 'id', None)
        else:
            raise RuntimeError('celery not configured')
    except Exception:
        try:
            from ..services.ai_narrator import generate_website_narrative
            scan.ai_analysis = generate_website_narrative(url, features, prediction, indicators)
            db.session.add(scan)
            db.session.commit()
        except Exception as e2:
            current_app.logger.error(f'AI narration failed for scan={scan.id}: {e2}')

    return success_response(
        data={
            'scan':       scan.to_dict(full=True),
            'risk_score': round(prediction['probability'] * 100, 1),
            'risk_label': prediction['label'],
            'features':   features,
            'indicators': indicators,
            'ai_analysis': None,
            'ai_task_id':  ai_task_id,
            **({'timings_ms': timings_ms} if (request.args.get('diagnose') == '1' or current_app.config.get('DEBUG')) else {}),
        },
        message=f'Website scan complete. Verdict: {prediction["label"].upper()}'
    )


@scan_bp.route('/history', methods=['GET'])
@jwt_required()
@limiter.limit('60 per minute')
def get_history():
    """
    GET /api/scan/history

    Paginated scan history for the authenticated user.

    Query params:
        page       (int, default 1)     — page number
        per_page   (int, default 20)    — results per page (max 100)
        scan_type  (str, optional)      — filter: 'url', 'email', 'website'
        risk_label (str, optional)      — filter: 'safe', 'suspicious', 'phishing'
        sort       (str, default 'desc') — 'asc' or 'desc' by created_at
    """
    user_id = get_jwt_identity()

    # Parse query parameters with safe defaults
    page       = min(max(request.args.get('page', 1, type=int), 1), 1000)
    per_page   = min(max(request.args.get('per_page', 20, type=int), 1), 100)
    scan_type  = request.args.get('scan_type', '').lower()
    risk_label = request.args.get('risk_label', '').lower()
    sort_order = request.args.get('sort', 'desc').lower()

    # Build the query
    query = Scan.query.filter_by(user_id=user_id)

    if scan_type in ('url', 'email', 'website'):
        query = query.filter_by(scan_type=scan_type)

    if risk_label in ('safe', 'suspicious', 'phishing'):
        query = query.filter_by(risk_label=risk_label)

    if sort_order == 'asc':
        query = query.order_by(Scan.created_at.asc())
    else:
        query = query.order_by(Scan.created_at.desc())

    # paginate() returns a Pagination object with items, total, pages, etc.
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        data={
            'scans':       [s.to_dict() for s in pagination.items],
            'pagination': {
                'page':       pagination.page,
                'per_page':   pagination.per_page,
                'total':      pagination.total,
                'pages':      pagination.pages,
                'has_next':   pagination.has_next,
                'has_prev':   pagination.has_prev,
            },
            'stats': Scan.get_user_stats(user_id),
        }
    )


@scan_bp.route('/<scan_id>', methods=['GET'])
@jwt_required()
def get_scan(scan_id):
    """GET /api/scan/<scan_id> — Full scan result."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return error_response('SCAN_NOT_FOUND', 'Scan record not found.', status_code=404)

    return success_response(data={'scan': scan.to_dict(full=True)})


@scan_bp.route('/<scan_id>/status', methods=['GET'])
@jwt_required()
def get_scan_status(scan_id):
    """Return Celery task state for the AI narrative and the persisted `ai_analysis`.

    Response includes:
      - `task_id`: Celery task id (or null)
      - `state`: one of 'PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'completed', 'not_scheduled', 'queued', 'error'
      - `ai_analysis`: persisted narrative if available
      - `result`: task result (when ready), optional
    """
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return error_response('SCAN_NOT_FOUND', 'Scan record not found.', status_code=404)

    task_id = getattr(scan, 'ai_task_id', None)

    # Default response payload
    payload = {
        'task_id': task_id,
        'state': None,
        'ai_analysis': scan.ai_analysis,
        'result': None,
    }

    if not task_id:
        payload['state'] = 'completed' if scan.ai_analysis else 'not_scheduled'
        return success_response(data=payload)

    try:
        if hasattr(current_app, 'celery'):
            res = current_app.celery.AsyncResult(task_id)
            payload['state'] = res.state
            try:
                if res.ready():
                    payload['result'] = res.result
            except Exception:
                payload['result'] = None
        else:
            payload['state'] = 'queued'
    except Exception as e:
        current_app.logger.error(f'Error fetching task status for {task_id}: {e}')
        payload['state'] = 'error'

    return success_response(data=payload)


@scan_bp.route('/statuses', methods=['GET', 'POST'])
@jwt_required()
def get_multiple_scan_statuses():
    """Return statuses for multiple scan ids.

    Accepts either:
      - GET ?ids=id1,id2,id3
      - POST JSON body: {"ids": ["id1","id2"]}

    Returns a list of {scan_id, task_id, state, ai_analysis, result}.
    """
    user_id = get_jwt_identity()

    ids = None
    if request.method == 'GET':
        ids_param = request.args.get('ids', '')
        ids = [i.strip() for i in ids_param.split(',') if i.strip()]
    else:
        body = request.get_json(silent=True) or {}
        ids = body.get('ids', [])

    if not ids:
        return error_response('INVALID_REQUEST', 'No scan ids provided.', status_code=400)

    results = []
    for scan_id in ids:
        scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
        if not scan:
            results.append({'scan_id': scan_id, 'error': 'not_found'})
            continue

        task_id = getattr(scan, 'ai_task_id', None)
        payload = {'scan_id': scan_id, 'task_id': task_id, 'ai_analysis': scan.ai_analysis, 'state': None, 'result': None}

        if not task_id:
            payload['state'] = 'completed' if scan.ai_analysis else 'not_scheduled'
            results.append(payload)
            continue

        try:
            if hasattr(current_app, 'celery'):
                res = current_app.celery.AsyncResult(task_id)
                payload['state'] = res.state
                try:
                    if res.ready():
                        payload['result'] = res.result
                except Exception:
                    payload['result'] = None
            else:
                payload['state'] = 'queued'
        except Exception as e:
            current_app.logger.error(f'Error fetching task status for {task_id}: {e}')
            payload['state'] = 'error'

        results.append(payload)

    return success_response(data={'statuses': results})


@scan_bp.route('/<scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    """DELETE /api/scan/<scan_id> — Remove a scan from history."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return error_response('SCAN_NOT_FOUND', 'Scan record not found.', status_code=404)

    db.session.delete(scan)
    user = User.query.get(user_id)
    if user and user.scan_count > 0:
        user.scan_count -= 1
    db.session.commit()

    return success_response(data=None, message='Scan deleted successfully.')