"""
URL Analyzer Service — extracts structural features from a URL and enriches
with WHOIS + SSL data to feed the ML engine.
"""
import re
import math
import concurrent.futures
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta

from ..extensions import db
from ..models.report import ThreatCache

# Known phishing / suspicious TLDs (expand as needed)
SUSPICIOUS_TLDS = {
    '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click',
    '.link', '.buzz', '.rest', '.icu', '.cam', '.loan', '.work',
    '.win', '.racing', '.review', '.stream', '.download', '.men',
}

# Brand names commonly spoofed in phishing URLs
BRAND_KEYWORDS = [
    'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix',
    'facebook', 'instagram', 'twitter', 'bank', 'secure', 'login',
    'account', 'verify', 'update', 'confirm', 'ebay', 'chase',
    'citibank', 'wellsfargo', 'support', 'helpdesk', 'signin',
]

# Patterns commonly found in phishing URLs
PHISHING_PATTERNS = [
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',   # IP address as host
    r'@',                                         # credentials in URL
    r'https?://[^/]*\.(php|asp|aspx)\?',         # script with query params
    r'bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly',    # URL shorteners
    r'[a-z0-9]{30,}',                            # very long random token
]


def _shannon_entropy(s: str) -> float:
    """Calculate Shannon entropy of a string (high entropy = more random)."""
    if not s:
        return 0.0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((f / n) * math.log2(f / n) for f in freq.values())


class URLAnalyzer:
    """
    Extracts 20+ structural and heuristic features from a URL.
    No ML here — pure rule-based feature engineering.
    """

    def extract_features(self, url: str) -> dict:
        parsed = urlparse(url)
        scheme   = parsed.scheme.lower()
        hostname = parsed.hostname or ''
        path     = parsed.path or ''
        query    = parsed.query or ''
        fragment = parsed.fragment or ''

        # --- Basic structural features ---
        url_len         = len(url)
        hostname_len    = len(hostname)
        path_len        = len(path)
        num_dots        = hostname.count('.')
        num_hyphens     = hostname.count('-')
        num_underscores = hostname.count('_')
        num_slashes     = url.count('/')
        num_params      = len(query.split('&')) if query else 0
        num_digits_host = sum(c.isdigit() for c in hostname)
        num_digits_path = sum(c.isdigit() for c in path)

        # --- Protocol and TLD ---
        has_https = scheme == 'https'
        tld = ''
        parts = hostname.rsplit('.', 2)
        if len(parts) >= 2:
            tld = '.' + parts[-1]
        is_suspicious_tld = tld.lower() in SUSPICIOUS_TLDS

        # --- Subdomain depth ---
        subdomain_count = max(num_dots - 1, 0)

        # --- Entropy of hostname ---
        domain_entropy = _shannon_entropy(hostname)

        # --- Brand / spoofing signals ---
        url_lower = url.lower()
        brand_in_url = any(b in url_lower for b in BRAND_KEYWORDS)

        # --- Phishing pattern matches ---
        phishing_pattern_hits = sum(
            1 for p in PHISHING_PATTERNS if re.search(p, url, re.IGNORECASE)
        )

        # --- Has non-standard port ---
        has_non_standard_port = bool(parsed.port and parsed.port not in (80, 443))

        # --- Query string encoding ---
        encoded_chars = url.count('%')

        # --- Fragment ---
        has_fragment = bool(fragment)

        return {
            'length':              url_len,
            'hostname_length':     hostname_len,
            'path_length':         path_len,
            'num_dots':            num_dots,
            'num_hyphens':         num_hyphens,
            'num_underscores':     num_underscores,
            'num_slashes':         num_slashes,
            'num_params':          num_params,
            'num_digits_host':     num_digits_host,
            'num_digits_path':     num_digits_path,
            'subdomain_count':     subdomain_count,
            'phishing_patterns':   phishing_pattern_hits,
            'encoded_chars':       encoded_chars,
            'has_https':                has_https,
            'is_suspicious_tld':        is_suspicious_tld,
            'brand_in_url':             brand_in_url,
            'has_non_standard_port':    has_non_standard_port,
            'has_fragment':             has_fragment,
            'domain_entropy': round(domain_entropy, 4),
            'hostname': hostname,
            'tld':      tld,
            'scheme':   scheme,
        }

    def _domain_from_url(self, url: str) -> str:
        return urlparse(url).hostname or url

    def enrich_with_threat_intel(self, url: str, features: dict) -> dict:
        """
        Enrich with WHOIS and SSL data concurrently.
        NEVER raises — all errors are caught and stored as partial data.
        A timeout or connection failure simply means those fields are absent.
        """
        domain = self._domain_from_url(url)
        enriched = dict(features)

        # DB cache hit?
        try:
            cached = ThreatCache.get_valid(domain)
            if cached:
                enriched.update(cached.threat_data or {})
                return enriched
        except Exception:
            pass  # Cache miss or DB error — continue with fresh lookup

        # Lazy import to avoid circular deps at startup
        try:
            from .ssl_service import SSLService
            from .whois_service import domain_age
        except ImportError as e:
            enriched['_enrichment_error'] = f'import_error: {e}'
            return enriched

        ssl_service = SSLService()
        ssl_res   = {'valid': None, 'error': 'not_attempted'}
        whois_res = {'age_days': None, 'error': 'not_attempted'}

        # Run WHOIS + SSL in parallel with a hard timeout
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
                fut_ssl   = ex.submit(ssl_service.check, url)
                fut_whois = ex.submit(domain_age, domain)
                try:
                    ssl_res = fut_ssl.result(timeout=6)
                except Exception as e:
                    ssl_res = {'valid': False, 'error': f'timeout_or_error: {str(e)[:60]}'}
                try:
                    whois_res = fut_whois.result(timeout=6)
                except Exception as e:
                    whois_res = {'age_days': None, 'error': f'timeout_or_error: {str(e)[:60]}'}
        except Exception as e:
            enriched['_enrichment_error'] = str(e)[:100]
            return enriched

        threat_data = {'whois': whois_res, 'ssl': ssl_res}

        # Persist cache (best-effort — failure is non-fatal)
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
            tc = ThreatCache(
                indicator      = domain,
                indicator_type = 'domain',
                threat_data    = threat_data,
                expires_at     = expires_at,
            )
            db.session.add(tc)
            db.session.commit()
        except Exception:
            try:
                db.session.rollback()
            except Exception:
                pass

        enriched.update(threat_data)
        return enriched

    def generate_indicators(self, enriched: dict, prediction: dict) -> list:
        """Translate raw features into human-readable indicator dicts."""
        indicators = []

        if not enriched.get('has_https'):
            indicators.append({'id': 'no_https', 'severity': 'high', 'label': 'No HTTPS', 'detail': 'Connection is not encrypted.'})
        if enriched.get('length', 0) > 75:
            indicators.append({'id': 'long_url', 'severity': 'medium', 'label': 'Long URL', 'detail': f"URL length is {enriched['length']} characters (>75)."})
        if enriched.get('num_dots', 0) > 3:
            indicators.append({'id': 'excessive_subdomains', 'severity': 'medium', 'label': 'Excessive Subdomains', 'detail': f"{enriched['num_dots']} dots detected."})
        if enriched.get('is_suspicious_tld'):
            indicators.append({'id': 'suspicious_tld', 'severity': 'high', 'label': 'Suspicious TLD', 'detail': f"Domain uses a high-risk TLD: {enriched.get('tld', '')}"})
        if enriched.get('brand_in_url'):
            indicators.append({'id': 'brand_spoofing', 'severity': 'high', 'label': 'Brand Spoofing Detected', 'detail': 'URL contains a well-known brand name suggesting impersonation.'})
        if enriched.get('phishing_patterns', 0) > 0:
            indicators.append({'id': 'phishing_pattern', 'severity': 'critical', 'label': 'Phishing Pattern Match', 'detail': f"{enriched['phishing_patterns']} known phishing URL pattern(s) matched."})
        if enriched.get('domain_entropy', 0) > 3.8:
            indicators.append({'id': 'high_entropy', 'severity': 'medium', 'label': 'High Domain Entropy', 'detail': 'Domain name appears randomly generated.'})
        if enriched.get('num_hyphens', 0) > 3:
            indicators.append({'id': 'hyphen_spam', 'severity': 'low', 'label': 'Hyphen Spam', 'detail': f"Domain contains {enriched['num_hyphens']} hyphens."})
        if enriched.get('has_non_standard_port'):
            indicators.append({'id': 'non_standard_port', 'severity': 'medium', 'label': 'Non-Standard Port', 'detail': 'URL targets a non-standard HTTP/HTTPS port.'})

        # WHOIS enrichment
        whois = enriched.get('whois', {})
        if isinstance(whois, dict):
            age_days = whois.get('age_days')
            if age_days is not None and age_days < 30:
                indicators.append({'id': 'new_domain', 'severity': 'high', 'label': 'Newly Registered Domain', 'detail': f'Domain is only {age_days} days old.'})

        # SSL enrichment
        ssl = enriched.get('ssl', {})
        if isinstance(ssl, dict) and ssl.get('valid') is False and ssl.get('error') not in ('not_https', 'timeout_or_error: timeout_or_error'):
            if 'cert_verification_failed' in str(ssl.get('error', '')):
                indicators.append({'id': 'invalid_ssl', 'severity': 'high', 'label': 'Invalid SSL Certificate', 'detail': ssl.get('error', 'SSL certificate is invalid or expired.')})

        if prediction.get('probability', 0) > 0.85:
            indicators.append({'id': 'ml_high_risk', 'severity': 'critical', 'label': 'ML: High Phishing Probability', 'detail': f"Model confidence: {prediction['probability']:.1%}"})

        return indicators
