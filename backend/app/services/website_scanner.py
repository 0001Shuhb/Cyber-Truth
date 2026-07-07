"""
Website Scanner Service — fetches a live page, parses the DOM for credential
harvesting forms, malicious scripts, and redirect chains.
"""
import re
import asyncio
from urllib.parse import urlparse

try:
    import httpx
    _HTTPX_AVAILABLE = True
except ImportError:
    _HTTPX_AVAILABLE = False


class WebsiteScanner:
    """
    Performs a real HTTP fetch and DOM analysis of a target URL.
    Detects login forms, suspicious scripts, redirect chains,
    iframe injection, and cookie security settings.

    All public methods are guaranteed to never raise — errors are
    returned as fields in the result dict.
    """

    TIMEOUT = 8.0
    MAX_REDIRECTS = 10
    USER_AGENT = (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0 Safari/537.36'
    )

    MALICIOUS_SCRIPT_PATTERNS = [
        r'eval\s*\(',
        r'document\.write\s*\(',
        r'unescape\s*\(',
        r'fromCharCode',
        r'atob\s*\(',
        r'window\.location\s*=',
        r'\.replace\s*\(/[^/]+/[gi]*\s*,',
    ]

    # ------------------------------------------------------------------ #
    # Fetch layer
    # ------------------------------------------------------------------ #

    async def _fetch_async(self, url: str) -> dict:
        result = {
            'status_code': None, 'content_length': 0,
            'final_url': url, 'redirect_chain': [],
            'html': '', 'headers': {}, 'error': None,
        }
        if not _HTTPX_AVAILABLE:
            result['error'] = 'httpx_not_installed'
            return result
        try:
            async with httpx.AsyncClient(
                timeout=self.TIMEOUT,
                follow_redirects=True,
                max_redirects=self.MAX_REDIRECTS,
                headers={'User-Agent': self.USER_AGENT},
                verify=False,
            ) as client:
                resp = await client.get(url)
                result['status_code']    = resp.status_code
                result['content_length'] = len(resp.content)
                result['final_url']      = str(resp.url)
                result['redirect_chain'] = [str(r.url) for r in resp.history]
                result['html']           = resp.text[:200_000]
                result['headers']        = dict(resp.headers)
        except httpx.TimeoutException:
            result['error'] = 'timeout'
        except httpx.TooManyRedirects:
            result['error'] = 'too_many_redirects'
        except Exception as e:
            result['error'] = str(e)[:200]
        return result

    def _run_fetch(self, url: str) -> dict:
        """Sync wrapper for _fetch_async. Never raises."""
        try:
            try:
                return asyncio.run(self._fetch_async(url))
            except RuntimeError:
                loop = asyncio.new_event_loop()
                try:
                    return loop.run_until_complete(self._fetch_async(url))
                finally:
                    loop.close()
        except Exception as e:
            return {
                'status_code': None, 'content_length': 0, 'final_url': url,
                'redirect_chain': [], 'html': '', 'headers': {},
                'error': str(e)[:200],
            }

    # ------------------------------------------------------------------ #
    # DOM / Header parsing
    # ------------------------------------------------------------------ #

    def _parse_dom(self, html: str, base_url: str) -> dict:
        """Regex-based DOM analysis. Never raises."""
        try:
            html_lower = html.lower()

            forms = re.findall(r'<form[^>]*>', html, re.IGNORECASE)
            num_forms = len(forms)

            password_inputs = len(re.findall(
                r'<input[^>]+type=["\']password["\']', html, re.IGNORECASE
            ))

            form_actions = re.findall(
                r'<form[^>]+action=["\']([^"\']+)["\']', html, re.IGNORECASE
            )
            base_domain = urlparse(base_url).hostname or ''
            external_form_actions = [
                a for a in form_actions
                if a.startswith('http') and (urlparse(a).hostname or '') != base_domain
            ]

            scripts = re.findall(
                r'<script[^>]*>(.*?)</script>', html, re.IGNORECASE | re.DOTALL
            )
            inline_scripts = len(scripts)
            obfuscated_scripts = sum(
                1 for s in scripts
                if any(re.search(p, s, re.IGNORECASE) for p in self.MALICIOUS_SCRIPT_PATTERNS)
            )

            ext_script_srcs = re.findall(
                r'<script[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE
            )

            iframes = re.findall(r'<iframe[^>]*>', html, re.IGNORECASE)
            num_iframes = len(iframes)
            hidden_iframes = len(re.findall(
                r'<iframe[^>]+(width=["\']0["\']|height=["\']0["\']|display:\s*none)',
                html, re.IGNORECASE
            ))

            meta_refresh = bool(re.search(
                r'<meta[^>]+http-equiv=["\']refresh["\']', html, re.IGNORECASE
            ))

            title_match = re.search(
                r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL
            )
            page_title = title_match.group(1).strip()[:100] if title_match else ''

            has_favicon  = bool(re.search(r'rel=["\'].*icon.*["\']', html, re.IGNORECASE))
            has_copyright = '©' in html or '&copy;' in html_lower or 'copyright' in html_lower
            num_images   = len(re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE))

            return {
                'num_forms':             num_forms,
                'password_inputs':       password_inputs,
                'external_form_actions': len(external_form_actions),
                'external_form_urls':    external_form_actions[:5],
                'inline_scripts':        inline_scripts,
                'obfuscated_scripts':    obfuscated_scripts,
                'external_scripts':      len(ext_script_srcs),
                'num_iframes':           num_iframes,
                'hidden_iframes':        hidden_iframes,
                'has_meta_refresh':      meta_refresh,
                'page_title':            page_title,
                'has_favicon':           has_favicon,
                'has_copyright':         has_copyright,
                'num_images':            num_images,
            }
        except Exception:
            return {}

    def _parse_security_headers(self, headers: dict) -> dict:
        """Check security response headers. Never raises."""
        try:
            h = {k.lower(): v for k, v in headers.items()}
            return {
                'has_csp':             'content-security-policy' in h,
                'has_hsts':            'strict-transport-security' in h,
                'has_x_frame_options': 'x-frame-options' in h,
                'has_x_content_type':  'x-content-type-options' in h,
                'server_header':       h.get('server', ''),
                'content_type':        h.get('content-type', ''),
            }
        except Exception:
            return {}

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def analyze(self, url: str) -> dict:
        """
        Full website analysis: fetch + DOM parse + security headers.
        NEVER raises — all errors are stored in the result dict.
        """
        fetch = self._run_fetch(url)
        html  = fetch.get('html', '')

        dom_analysis = self._parse_dom(html, url)
        sec_headers  = self._parse_security_headers(fetch.get('headers', {}))

        redirect_chain = fetch.get('redirect_chain', [])
        num_redirects  = len(redirect_chain)
        final_url      = fetch.get('final_url', url)

        try:
            domain_changed = urlparse(url).hostname != urlparse(final_url).hostname
        except Exception:
            domain_changed = False

        return {
            'status_code':    fetch.get('status_code'),
            'content_length': fetch.get('content_length', 0),
            'final_url':      final_url,
            'redirect_chain': redirect_chain,
            'num_redirects':  num_redirects,
            'domain_changed': domain_changed,
            'fetch_error':    fetch.get('error'),
            **dom_analysis,
            **sec_headers,
        }

    def generate_indicators(self, features: dict, prediction: dict) -> list:
        """Generate human-readable indicator dicts from scan features."""
        indicators = []

        if features.get('fetch_error'):
            indicators.append({
                'id': 'fetch_error', 'severity': 'medium',
                'label': 'Page Fetch Error',
                'detail': f"Could not retrieve the page: {features['fetch_error']}"
            })

        if features.get('password_inputs', 0) > 0:
            indicators.append({
                'id': 'password_form', 'severity': 'high',
                'label': 'Login / Credential Form Detected',
                'detail': f"{features['password_inputs']} password input(s) found on page."
            })

        if features.get('external_form_actions', 0) > 0:
            indicators.append({
                'id': 'external_form_post', 'severity': 'critical',
                'label': 'Form Posts to External Domain',
                'detail': 'A form on this page submits data to an external server — classic credential harvesting.'
            })

        if features.get('obfuscated_scripts', 0) > 0:
            indicators.append({
                'id': 'obfuscated_js', 'severity': 'critical',
                'label': 'Obfuscated JavaScript Detected',
                'detail': f"{features['obfuscated_scripts']} script(s) use eval/unescape/fromCharCode obfuscation."
            })

        if features.get('hidden_iframes', 0) > 0:
            indicators.append({
                'id': 'hidden_iframe', 'severity': 'critical',
                'label': 'Hidden iFrame Detected',
                'detail': f"{features['hidden_iframes']} zero-size or hidden iFrame(s) found — used for clickjacking."
            })

        if features.get('has_meta_refresh'):
            indicators.append({
                'id': 'meta_refresh', 'severity': 'high',
                'label': 'Auto-Redirect (Meta Refresh)',
                'detail': 'Page automatically redirects the visitor using a meta refresh tag.'
            })

        if features.get('domain_changed'):
            indicators.append({
                'id': 'domain_redirect', 'severity': 'high',
                'label': 'Redirect to Different Domain',
                'detail': f"Redirected to: {features.get('final_url', '')[:80]}"
            })

        if features.get('num_redirects', 0) > 3:
            indicators.append({
                'id': 'redirect_chain', 'severity': 'medium',
                'label': 'Long Redirect Chain',
                'detail': f"{features['num_redirects']} redirects followed before reaching the page."
            })

        if not features.get('has_csp'):
            indicators.append({
                'id': 'missing_csp', 'severity': 'low',
                'label': 'No Content Security Policy',
                'detail': 'Page lacks a CSP header, increasing XSS risk.'
            })

        if not features.get('has_hsts'):
            indicators.append({
                'id': 'missing_hsts', 'severity': 'low',
                'label': 'No HSTS Header',
                'detail': 'HTTPS is not enforced via Strict-Transport-Security.'
            })

        if not features.get('has_copyright'):
            indicators.append({
                'id': 'no_copyright', 'severity': 'info',
                'label': 'No Copyright Text',
                'detail': 'Page has no copyright notice — common in quickly spun-up phishing clones.'
            })

        if prediction.get('probability', 0) > 0.7:
            indicators.append({
                'id': 'ml_high_risk', 'severity': 'critical',
                'label': 'ML Model: High Phishing Probability',
                'detail': f"Model confidence: {prediction['probability']:.1%}"
            })

        return indicators
