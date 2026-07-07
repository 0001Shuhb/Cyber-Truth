# app/utils/security.py
"""
Security utility functions.

These helpers centralize security logic so it's not scattered
across routes. Every input sanitization, every rate limit check,
every security header application goes through here.

COMMON BEGINNER MISTAKE: Sanitizing output (when rendering HTML)
but forgetting to sanitize input. Or sanitizing in some routes
but not others. Centralized utilities make it harder to forget.
"""

import re
import bleach
import hashlib
from urllib.parse import urlparse
from flask import request


# =====================================================
# Input Sanitization
# =====================================================

def sanitize_string(text: str, max_length: int = 10000) -> str:
    """
    Sanitize a string input:
    1. Strip leading/trailing whitespace
    2. Remove HTML tags (prevent stored XSS)
    3. Enforce maximum length

    WHY bleach?
    bleach.clean() parses the HTML and strips disallowed tags.
    Naive regex like r'<.*?>' is bypassable with malformed HTML.
    bleach is battle-tested for XSS prevention.
    """
    if not isinstance(text, str):
        return ''

    text = text.strip()

    # Remove all HTML tags — we never want to store/render HTML from users
    # ALLOWED_TAGS=[] means no tags are allowed at all
    text = bleach.clean(text, tags=[], strip=True)

    # Enforce length to prevent DoS via huge payloads
    return text[:max_length]


def sanitize_url(url: str) -> str:
    """
    Sanitize a URL input with stricter rules than general strings.

    1. Strip whitespace
    2. Check it looks like a URL (starts with http/https or has a domain)
    3. Limit length

    WHY special handling for URLs?
    URLs can contain javascript: scheme, data: URIs, and other
    dangerous values. We parse them to extract just the meaningful parts.
    """
    url = url.strip()[:2048]

    # Null bytes in URLs are a classic injection technique
    url = url.replace('\x00', '')

    # Remove any whitespace within the URL
    url = re.sub(r'\s+', '', url)

    return url


def get_client_ip() -> str:
    """
    Get the real client IP address.

    Behind a proxy/load balancer (Nginx, Cloudflare), the client IP
    is in the X-Forwarded-For header, not request.remote_addr.

    X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2.
    We take the FIRST one (leftmost) — that's the original client.

    SECURITY NOTE: X-Forwarded-For can be spoofed by clients.
    In production, only trust it if your load balancer sets it.
    Configure TRUSTED_PROXIES in Flask for production deployments.
    """
    forwarded_for = request.headers.get('X-Forwarded-For', '')
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(',')[0].strip()
    return request.remote_addr or '127.0.0.1'


def hash_ip(ip: str) -> str:
    """
    Hash an IP address for privacy-preserving storage.

    GDPR and privacy regulations consider IP addresses personal data.
    By storing a salted hash instead of the raw IP, we can still
    detect abuse patterns without storing identifiable information.

    We use SHA-256, not bcrypt, because we need fast lookups.
    """
    salt = 'phishguard-ip-salt-2024'  # In production, use a real secret
    return hashlib.sha256(f'{salt}{ip}'.encode()).hexdigest()[:16]


# =====================================================
# URL Validation
# =====================================================

def is_valid_url(url: str) -> bool:
    """
    Check if a string is a valid HTTP/HTTPS URL.

    We use urllib.parse which handles edge cases correctly.
    A URL is valid if:
    1. It has a scheme (http or https)
    2. It has a netloc (domain name or IP address)
    3. The netloc contains at least one dot (prevents bare words)
    """
    try:
        result = urlparse(url)
        return (
            result.scheme in ('http', 'https') and
            bool(result.netloc) and
            '.' in result.netloc
        )
    except Exception:
        return False


def is_internal_url(url: str) -> bool:
    """
    Detect Server-Side Request Forgery (SSRF) attempts.

    SSRF: attacker submits a URL like http://localhost/admin or
    http://169.254.169.254/latest/meta-data/ (AWS metadata endpoint).
    If our backend fetches this URL, it could expose internal services.

    We block private IP ranges and localhost variants.
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ''

        # Obvious localhost variants
        if hostname in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
            return True

        # Private IP ranges (RFC 1918)
        import ipaddress
        try:
            ip = ipaddress.ip_address(hostname)
            return (
                ip.is_private or
                ip.is_loopback or
                ip.is_link_local or
                ip.is_reserved or
                # AWS metadata endpoint
                str(ip).startswith('169.254.')
            )
        except ValueError:
            # hostname is a domain name, not an IP — check for internal domains
            internal_tlds = ['.local', '.internal', '.corp', '.lan']
            return any(hostname.endswith(tld) for tld in internal_tlds)

    except Exception:
        return False


# =====================================================
# Security Headers
# =====================================================

def apply_security_headers(response):
    """
    Apply security headers to every HTTP response.

    Called from the app's after_request hook so no route
    has to remember to add these manually.

    Each header explained:
    """
    # Prevents browsers from guessing Content-Type.
    # Without this, a browser might "sniff" a text/plain response as JavaScript.
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # Prevents the page from being embedded in an iframe.
    # Blocks clickjacking attacks where your page is overlaid with a fake UI.
    response.headers['X-Frame-Options'] = 'DENY'

    # For HTTPS: tells browsers to only use HTTPS for this domain for 1 year.
    # max-age=31536000 = 1 year in seconds
    # includeSubDomains: applies to all subdomains
    # preload: eligible for browser HSTS preload lists
    response.headers['Strict-Transport-Security'] = (
        'max-age=31536000; includeSubDomains; preload'
    )

    # Controls how much referrer info is sent when navigating away.
    # 'strict-origin-when-cross-origin': send full URL within origin,
    # only the origin (no path) for cross-origin requests.
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Prevents loading content from unexpected sources.
    # Our API only returns JSON, so most directives are 'none'.
    response.headers['Content-Security-Policy'] = (
        "default-src 'none'; "
        "frame-ancestors 'none'"
    )

    return response