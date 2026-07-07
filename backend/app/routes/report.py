# app/routes/report.py
"""
Report generation endpoints.

POST /api/report/generate/<scan_id>  — Generate a PDF report for a scan
GET  /api/report/download/<id>       — Download a generated PDF
GET  /api/report/list                — List all reports for current user
DELETE /api/report/<id>              — Delete a report

HOW PDF GENERATION WORKS:
1. Fetch the scan record from the database
2. Render an HTML template with the scan data
3. Convert HTML → PDF using WeasyPrint
4. Save the PDF to disk (reports/ directory)
5. Store the file path in the Report model
6. Return the report ID so the frontend can download it

WHY HTML → PDF instead of a PDF library like ReportLab?
HTML/CSS gives you full design control with the same cybersecurity
theme as your frontend. ReportLab requires learning a completely
different layout API. WeasyPrint renders pixel-perfect PDFs from
the same CSS you already know.
"""

import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, current_app, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db, limiter
from ..models.scan import Scan
from ..models.report import Report
from ..utils.response import success_response, error_response

report_bp = Blueprint('report', __name__)

# Directory where generated PDFs are stored
# In production, use cloud storage (S3, GCS) instead of local disk
REPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'reports')


def _ensure_reports_dir():
    """Create the reports directory if it doesn't exist."""
    os.makedirs(REPORTS_DIR, exist_ok=True)


def _generate_report_html(scan: Scan) -> str:
    """
    Build the HTML string for the PDF report.

    This is a self-contained HTML document with inline CSS —
    WeasyPrint doesn't load external stylesheets by default,
    so all styles must be embedded.

    The report includes:
    - Header with scan metadata
    - Risk score gauge (CSS-based)
    - Indicators table
    - Feature breakdown
    - AI analysis narrative
    - Recommendations section
    """
    risk_color = {
        'safe':       '#00ff88',
        'suspicious': '#ffaa00',
        'phishing':   '#ff3366',
    }.get(scan.risk_label, '#8899aa')

    score_display = round(scan.risk_score * 100, 1)

    # Build indicators HTML
    indicators_html = ''
    for indicator in (scan.indicators or []):
        severity_color = {
            'critical': '#ff3366',
            'high':     '#ff6633',
            'medium':   '#ffaa00',
            'low':      '#00ff88',
        }.get(indicator.get('severity', 'medium'), '#ffaa00')

        indicators_html += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;font-family:monospace;font-size:12px">
                {indicator.get('title', 'Unknown')}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;font-size:12px;color:#94a3b8">
                {indicator.get('description', '')}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;text-align:center">
                <span style="background:{severity_color}20;color:{severity_color};
                             border:1px solid {severity_color}40;padding:3px 10px;
                             border-radius:20px;font-size:11px;font-family:monospace;
                             text-transform:uppercase">
                    {indicator.get('severity', 'medium')}
                </span>
            </td>
        </tr>"""

    # Build features HTML
    features_html = ''
    raw_features = scan.raw_features or {}
    for key, value in list(raw_features.items())[:15]:  # Show top 15 features
        features_html += f"""
        <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #1a2d4a;
                       font-family:monospace;font-size:12px;color:#94a3b8">
                {key.replace('_', ' ').title()}
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #1a2d4a;
                       font-family:monospace;font-size:12px">
                {value}
            </td>
        </tr>"""

    # Recommendations based on verdict
    recommendations = {
        'phishing': [
            ('Block Immediately',    'Add this indicator to your firewall/DNS blocklist.'),
            ('Alert Affected Users', 'Notify anyone who may have interacted with this threat.'),
            ('Report to Registrar',  'Submit abuse reports to accelerate domain takedown.'),
            ('Share IOCs',           'Submit indicators to VirusTotal, AbuseIPDB, and your ISAC.'),
        ],
        'suspicious': [
            ('Monitor Closely',      'Add to watchlist and re-scan in 24 hours.'),
            ('Warn Users',           'Advise caution before interacting with this resource.'),
            ('Gather More Context',  'Manually review the resource before taking action.'),
        ],
        'safe': [
            ('No Action Required',   'Resource appears legitimate based on current analysis.'),
            ('Periodic Rescanning',  'Re-scan periodically as threat landscape evolves.'),
        ],
    }.get(scan.risk_label, [])

    recommendations_html = ''
    for i, (title, desc) in enumerate(recommendations, 1):
        recommendations_html += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;
                       font-family:monospace;font-size:13px;color:#00d4ff;
                       font-weight:bold;width:30px;text-align:center">
                {i}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;
                       font-weight:600;font-size:13px">
                {title}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1a2d4a;
                       font-size:12px;color:#94a3b8">
                {desc}
            </td>
        </tr>"""

    # Full HTML document
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cyber Truth Report — {scan.id[:8]}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  
  body {{
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: #050d1a;
    color: #e2e8f0;
    font-size: 13px;
    line-height: 1.6;
  }}

  .page {{
    max-width: 900px;
    margin: 0 auto;
    padding: 40px;
  }}

  /* Header */
  .report-header {{
    background: linear-gradient(135deg, #0a1628, #030912);
    border: 1px solid #1a2d4a;
    border-top: 3px solid #00d4ff;
    border-radius: 12px;
    padding: 28px 32px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }}

  .logo {{
    font-family: 'Rajdhani', 'Arial Black', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #ffffff;
  }}

  .logo span {{ color: #00d4ff; }}

  .report-meta {{
    font-family: monospace;
    font-size: 11px;
    color: #64748b;
    letter-spacing: 1px;
    text-align: right;
    line-height: 1.8;
  }}

  .report-title {{
    font-size: 20px;
    font-weight: 700;
    margin: 14px 0 4px;
    letter-spacing: 0.5px;
  }}

  .report-target {{
    font-family: monospace;
    font-size: 12px;
    color: #64748b;
    word-break: break-all;
  }}

  /* Score section */
  .score-section {{
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
  }}

  .score-card {{
    background: #0a1628;
    border: 1px solid #1a2d4a;
    border-radius: 12px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
  }}

  .score-number {{
    font-family: 'Rajdhani', monospace;
    font-size: 72px;
    font-weight: 700;
    color: {risk_color};
    line-height: 1;
    text-shadow: 0 0 30px {risk_color}60;
  }}

  .score-details {{ flex: 1; }}

  .verdict-badge {{
    display: inline-block;
    background: {risk_color}15;
    color: {risk_color};
    border: 1px solid {risk_color}40;
    padding: 5px 16px;
    border-radius: 20px;
    font-family: monospace;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }}

  .score-bar-bg {{
    height: 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }}

  .score-bar-fill {{
    height: 100%;
    width: {score_display}%;
    background: linear-gradient(90deg, #ffaa00, {risk_color});
    border-radius: 4px;
  }}

  /* Section styling */
  .section {{
    background: #0a1628;
    border: 1px solid #1a2d4a;
    border-radius: 12px;
    padding: 22px 24px;
    margin-bottom: 20px;
  }}

  .section-title {{
    font-family: monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #1a2d4a;
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .section-title::before {{
    content: '';
    width: 3px;
    height: 14px;
    background: #00d4ff;
    border-radius: 2px;
    display: inline-block;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
  }}

  th {{
    text-align: left;
    padding: 8px 10px;
    font-family: monospace;
    font-size: 10px;
    letter-spacing: 2px;
    color: #64748b;
    border-bottom: 1px solid #1a2d4a;
    text-transform: uppercase;
  }}

  /* AI analysis box */
  .ai-box {{
    background: rgba(0,212,255,0.04);
    border: 1px solid rgba(0,212,255,0.15);
    border-radius: 10px;
    padding: 16px 18px;
    font-size: 13px;
    line-height: 1.8;
    color: #94a3b8;
    position: relative;
  }}

  .ai-label {{
    position: absolute;
    top: 12px;
    right: 14px;
    font-family: monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: rgba(0,212,255,0.4);
    text-transform: uppercase;
  }}

  /* Footer */
  .footer {{
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #1a2d4a;
    display: flex;
    justify-content: space-between;
    font-family: monospace;
    font-size: 10px;
    color: #64748b;
    letter-spacing: 1px;
  }}

  .confidential {{
    background: rgba(255,51,102,0.08);
    border: 1px solid rgba(255,51,102,0.2);
    color: #ff3366;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="report-header">
    <div>
      <div class="logo">PHISH<span>GUARD</span></div>
      <div style="font-size:10px;color:#64748b;font-family:monospace;
                  letter-spacing:2px;margin-top:2px">THREAT INTELLIGENCE PLATFORM</div>
      <div class="report-title">
        {scan.scan_type.upper()} Phishing Analysis Report
      </div>
      <div class="report-target">{scan.input_data[:120]}</div>
    </div>
    <div class="report-meta">
      <div>REPORT ID: RPT-{scan.id[:8].upper()}</div>
      <div>SCAN ID: {scan.id[:8].upper()}</div>
      <div>TYPE: {scan.scan_type.upper()}</div>
      <div>MODEL: {scan.model_version}</div>
      <div>GENERATED: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</div>
    </div>
  </div>

  <!-- RISK SCORE -->
  <div class="score-section">
    <div class="score-card">
      <div class="score-number">{int(score_display)}</div>
      <div class="score-details">
        <div class="verdict-badge">{scan.risk_label}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:6px">
          Risk Score out of 100
        </div>
        <div class="score-bar-bg">
          <div class="score-bar-fill"></div>
        </div>
        <div style="display:flex;justify-content:space-between;
                    font-family:monospace;font-size:10px;color:#64748b;margin-top:4px">
          <span>SAFE</span>
          <span>SUSPICIOUS</span>
          <span>PHISHING</span>
        </div>
      </div>
    </div>

    <div style="background:#0a1628;border:1px solid #1a2d4a;border-radius:12px;
                padding:20px 22px;min-width:200px">
      <div class="section-title" style="margin-bottom:12px">Scan Details</div>
      {''.join(f'''
      <div style="display:flex;justify-content:space-between;padding:5px 0;
                  border-bottom:1px solid rgba(26,45,74,0.5)">
        <span style="font-family:monospace;font-size:11px;color:#64748b">{k}</span>
        <span style="font-family:monospace;font-size:11px">{v}</span>
      </div>''' for k, v in [
          ('Scan Type',    scan.scan_type.upper()),
          ('Duration',     f"{scan.scan_duration_ms}ms" if scan.scan_duration_ms else 'N/A'),
          ('Indicators',   str(len(scan.indicators or []))),
          ('Scanned At',   scan.created_at.strftime('%Y-%m-%d') if scan.created_at else 'N/A'),
      ])}
    </div>
  </div>

  <!-- AI ANALYSIS -->
  <div class="section">
    <div class="section-title">AI-Generated Analysis</div>
    <div class="ai-box">
      <span class="ai-label">AI POWERED</span>
      {scan.ai_analysis or 'No AI analysis available for this scan.'}
    </div>
  </div>

  <!-- INDICATORS -->
  {f'''
  <div class="section">
    <div class="section-title">Threat Indicators ({len(scan.indicators or [])} found)</div>
    <table>
      <thead>
        <tr>
          <th>Indicator</th>
          <th>Description</th>
          <th style="text-align:center">Severity</th>
        </tr>
      </thead>
      <tbody>{indicators_html}</tbody>
    </table>
  </div>''' if scan.indicators else ''}

  <!-- FEATURE BREAKDOWN -->
  {f'''
  <div class="section">
    <div class="section-title">Extracted Features</div>
    <table>
      <thead>
        <tr><th>Feature</th><th>Value</th></tr>
      </thead>
      <tbody>{features_html}</tbody>
    </table>
  </div>''' if raw_features else ''}

  <!-- RECOMMENDATIONS -->
  <div class="section">
    <div class="section-title">Recommended Actions</div>
    <table>
      <thead>
        <tr><th style="width:40px">#</th><th>Action</th><th>Details</th></tr>
      </thead>
      <tbody>{recommendations_html}</tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>
      <div>CYBER TRUTH THREAT INTELLIGENCE PLATFORM — v1.0.0</div>
      <div style="margin-top:3px">
        Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
      </div>
    </div>
    <div style="text-align:right">
      <div class="confidential">TLP:AMBER — Restricted Distribution</div>
      <div style="margin-top:4px">
        This report is generated automatically by AI analysis.
      </div>
    </div>
  </div>

</div>
</body>
</html>"""


@report_bp.route('/generate/<scan_id>', methods=['POST'])
@jwt_required()
@limiter.limit('20 per hour')
def generate_report(scan_id):
    """
    POST /api/report/generate/<scan_id>

    Generate a PDF report for a completed scan.

    Steps:
    1. Verify the scan belongs to the current user
    2. Check if a report already exists (avoid regenerating)
    3. Render the HTML template with scan data
    4. Convert HTML to PDF with WeasyPrint
    5. Save to disk and record in the reports table

    Returns:
        201: Report generated, returns report metadata + download URL
        404: Scan not found
        409: Report already exists (returns existing report)
        500: PDF generation failed
    """
    user_id = get_jwt_identity()

    # ==================================================
    # 1. Fetch and Authorize the Scan
    # ==================================================
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return error_response(
            'SCAN_NOT_FOUND',
            'Scan not found or you do not have permission to access it.',
            status_code=404
        )

    # ==================================================
    # 2. Check for Existing Report
    # ==================================================
    existing = Report.query.filter_by(scan_id=scan_id, user_id=user_id).first()
    if existing:
        return success_response(
            data={
                'report':       existing.to_dict(),
                'download_url': f'/api/report/download/{existing.id}',
                'already_existed': True,
            },
            message='Report already exists.',
            status_code=200
        )

    # ==================================================
    # 3. Generate PDF
    # ==================================================
    _ensure_reports_dir()

    report_filename = f'cyber_truth_report_{scan_id[:8]}_{uuid.uuid4().hex[:6]}.pdf'
    report_filepath = os.path.join(REPORTS_DIR, report_filename)

    try:
        html_content = _generate_report_html(scan)

        # Try WeasyPrint first (best quality)
        try:
            from weasyprint import HTML as WeasyHTML
            WeasyHTML(string=html_content).write_pdf(report_filepath)

        except ImportError:
            # WeasyPrint not installed — fall back to saving HTML
            # In production, always install WeasyPrint
            current_app.logger.warning(
                'WeasyPrint not installed. Saving HTML report instead. '
                'Run: pip install weasyprint'
            )
            report_filepath = report_filepath.replace('.pdf', '.html')
            with open(report_filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)

    except Exception as e:
        current_app.logger.error(f'Report generation failed for scan {scan_id}: {e}')
        return error_response(
            'GENERATION_FAILED',
            'Failed to generate report. Please try again.',
            status_code=500
        )

    # ==================================================
    # 4. Save Report Record to Database
    # ==================================================
    report = Report(
        scan_id     = scan_id,
        user_id     = user_id,
        report_type = 'pdf',
        file_path   = report_filepath,
    )
    db.session.add(report)
    db.session.commit()

    return success_response(
        data={
            'report':       report.to_dict(),
            'download_url': f'/api/report/download/{report.id}',
        },
        message='Report generated successfully.',
        status_code=201
    )


@report_bp.route('/download/<report_id>', methods=['GET'])
@jwt_required()
def download_report(report_id):
    """
    GET /api/report/download/<report_id>

    Stream the PDF file to the client.

    send_file() handles:
    - Setting Content-Type to application/pdf
    - Content-Disposition header (triggers browser download)
    - Range requests (for large PDFs)
    - ETags for caching

    Security: We verify the report belongs to the requesting user
    before serving the file. Without this check, any authenticated
    user could download any report by guessing the UUID.
    """
    user_id = get_jwt_identity()

    report = Report.query.filter_by(id=report_id, user_id=user_id).first()

    if not report:
        return error_response(
            'REPORT_NOT_FOUND',
            'Report not found or access denied.',
            status_code=404
        )

    if not report.file_path or not os.path.exists(report.file_path):
        return error_response(
            'FILE_NOT_FOUND',
            'Report file no longer exists. Please regenerate.',
            status_code=404
        )

    # Record the download timestamp
    report.downloaded_at = datetime.now(timezone.utc)
    db.session.commit()

    # Determine filename for the download dialog
    scan = Scan.query.get(report.scan_id)
    download_name = f'CyberTruth_Report_{report.scan_id[:8]}.pdf'

    return send_file(
        report.file_path,
        mimetype='application/pdf',
        as_attachment=True,         # Forces browser download dialog
        download_name=download_name,
    )


@report_bp.route('/list', methods=['GET'])
@jwt_required()
@limiter.limit('60 per minute')
def list_reports():
    """
    GET /api/report/list

    Paginated list of reports generated by the current user,
    with associated scan metadata included.
    """
    user_id  = get_jwt_identity()
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    pagination = Report.query.filter_by(user_id=user_id)\
        .order_by(Report.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    reports_data = []
    for r in pagination.items:
        report_dict = r.to_dict()
        # Include basic scan info so the frontend can show context
        scan = Scan.query.get(r.scan_id)
        if scan:
            report_dict['scan_summary'] = {
                'scan_type':  scan.scan_type,
                'risk_label': scan.risk_label,
                'risk_score': round(scan.risk_score * 100, 1),
                'input_preview': scan.input_data[:80],
            }
        reports_data.append(report_dict)

    return success_response(
        data={
            'reports': reports_data,
            'pagination': {
                'total':    pagination.total,
                'page':     pagination.page,
                'pages':    pagination.pages,
                'has_next': pagination.has_next,
            }
        }
    )


@report_bp.route('/<report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    """
    DELETE /api/report/<report_id>

    Delete a report record and its associated PDF file from disk.
    Only the owner can delete their own reports.
    """
    user_id = get_jwt_identity()

    report = Report.query.filter_by(id=report_id, user_id=user_id).first()

    if not report:
        return error_response('REPORT_NOT_FOUND', 'Report not found.', status_code=404)

    # Delete the physical file from disk
    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except OSError as e:
            current_app.logger.warning(f'Could not delete report file {report.file_path}: {e}')

    db.session.delete(report)
    db.session.commit()

    return success_response(data=None, message='Report deleted successfully.')