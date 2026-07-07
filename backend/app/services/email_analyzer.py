"""
Email Analyzer Service — comprehensive phishing analysis of email content.

Supports:
  - Raw pasted text (headers + body)
  - Parsed .eml file content (via Python email module)
  - Extracted text from screenshots (passed in as plain text)

Detection checks:
  - Sender spoofing / brand impersonation
  - SPF / DKIM / DMARC header evaluation
  - Reply-To / From mismatch
  - Shortened URL detection
  - Obfuscated / href-mismatch URLs
  - Urgency / social-engineering language
  - Credential harvesting phrases
  - Attachment risk (MIME type analysis from .eml)
  - Blacklisted domains
  - Grammar / tone signals (caps ratio, excessive punctuation)
  - Known phishing keyword patterns
"""
import re
import email as email_lib
import email.policy
from email import message_from_bytes, message_from_string
from urllib.parse import urlparse

# ── Urgency / Social Engineering keywords ────────────────────────────────────
URGENCY_WORDS = [
    'urgent', 'immediately', 'action required', 'account suspended',
    'verify now', 'click here', 'limited time', 'expires', 'warning',
    'alert', 'important notice', 'confirm your', 'update your',
    'your account will be', 'failure to', 'within 24 hours',
    'within 48 hours', 'respond immediately', 'validate your',
    'security alert', 'unauthorized access', 'suspicious activity',
    'act now', 'last chance', 'final warning', 'account locked',
    'access denied', 'payment failed', 'password expired',
    'unusual sign-in', 'login attempt', 'we detected',
]

# ── Credential-harvesting phrases ─────────────────────────────────────────────
CREDENTIAL_PHRASES = [
    'enter your password', 'enter your username', 'provide your',
    'submit your credentials', 'login details', 'banking information',
    'credit card', 'social security', 'ssn', 'date of birth',
    "mother's maiden name", 'security question', 'verify your identity',
    'confirm your account', 're-enter your', 'validate your payment',
    'billing information', 'card number', 'cvv', 'expiry date',
    'bank account', 'routing number', 'wire transfer',
]

# ── Known sender-spoofed brands ───────────────────────────────────────────────
SPOOFED_BRANDS = [
    'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix',
    'facebook', 'instagram', 'twitter', 'bank', 'chase', 'wells fargo',
    'citibank', 'irs', 'ebay', 'linkedin', 'dropbox', 'fedex', 'ups',
    'usps', 'dhl', 'docusign', 'zoom', 'whatsapp', 'telegram',
    'coinbase', 'binance', 'robinhood', 'venmo', 'cashapp',
]

# ── URL shorteners ─────────────────────────────────────────────────────────────
SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
    'rebrand.ly', 'cutt.ly', 'bl.ink', 'short.io', 'tiny.cc',
    'is.gd', 'cli.gs', 'u.nu', 'x.co', 'lnkd.in', 'youtu.be',
    'fb.me', 'amzn.to', 'snurl.com', 'shorturl.at', 'urlzs.com',
}

# ── Blacklisted / known-phishing domains (representative sample) ──────────────
BLACKLISTED_DOMAINS = {
    'phishingsite.com', 'malware-host.net', 'evil-corp.io',
    'login-secure-paypal.com', 'apple-id-verify.net',
    'amazon-security-alert.com', 'microsoft-support-alert.net',
    'account-google-verify.com', 'netflix-billing-update.com',
    'irs-refund-gov.com', 'fedex-delivery-update.net',
    'secure-bank-login.com', 'update-your-info.net',
}

# ── Dangerous attachment MIME types ───────────────────────────────────────────
DANGEROUS_MIME_TYPES = {
    'application/x-msdownload', 'application/x-executable',
    'application/x-sh', 'application/x-bat', 'application/vnd.ms-office',
    'application/x-msdos-program', 'application/x-javascript',
    'application/octet-stream',
}
RISKY_EXTENSIONS = {
    '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.jar',
    '.scr', '.pif', '.com', '.msi', '.dmg', '.sh', '.py',
    '.docm', '.xlsm', '.pptm',  # macro-enabled Office
}

# ── Regex helpers ─────────────────────────────────────────────────────────────
URL_REGEX = re.compile(r'https?://[^\s<>"\']+', re.IGNORECASE)
EMAIL_ADDR_REGEX = re.compile(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}')
EXCESSIVE_PUNCT_RE = re.compile(r'[!?]{2,}')


class EmailAnalyzer:
    """
    Analyses raw email text (headers + body) or parsed .eml content.
    """

    # ── Public entry points ───────────────────────────────────────────────────

    def parse_eml(self, raw_bytes: bytes) -> dict:
        """
        Parse a .eml file (bytes) and return a dict with:
          - 'text'       : combined headers + body text for analysis
          - 'attachments': list of attachment metadata dicts
          - 'headers'    : dict of key headers
        """
        try:
            msg = message_from_bytes(raw_bytes, policy=email_lib.policy.compat32)
        except Exception:
            msg = message_from_string(raw_bytes.decode('utf-8', errors='replace'))

        headers = {}
        for key in ['From', 'To', 'Reply-To', 'Subject', 'Date',
                    'Received-SPF', 'Authentication-Results',
                    'DKIM-Signature', 'ARC-Authentication-Results',
                    'X-Mailer', 'Message-ID']:
            headers[key] = msg.get(key, '')

        # Collect all Received headers for relay chain analysis
        headers['Received'] = msg.get_all('Received') or []

        body_parts = []
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition = str(part.get('Content-Disposition', ''))
                filename = part.get_filename() or ''

                if 'attachment' in disposition or filename:
                    attachments.append({
                        'filename': filename,
                        'content_type': content_type,
                        'size_bytes': len(part.get_payload(decode=True) or b''),
                        'is_dangerous': self._is_dangerous_attachment(
                            filename, content_type
                        ),
                    })
                elif content_type in ('text/plain', 'text/html'):
                    try:
                        payload = part.get_payload(decode=True)
                        body_parts.append(payload.decode('utf-8', errors='replace'))
                    except Exception:
                        pass
        else:
            try:
                payload = msg.get_payload(decode=True)
                if payload:
                    body_parts.append(payload.decode('utf-8', errors='replace'))
            except Exception:
                body_parts.append(str(msg.get_payload()))

        # Reconstruct a header block for pattern analysis
        header_block = '\n'.join(f'{k}: {v}' for k, v in headers.items()
                                 if v and not isinstance(v, list))
        text = header_block + '\n\n' + '\n'.join(body_parts)

        return {
            'text': text,
            'attachments': attachments,
            'headers': headers,
        }

    def extract_features(self, content: str, attachments: list = None,
                         headers: dict = None) -> dict:
        """
        Extract all phishing features from email content string.

        Args:
            content   : raw email text (headers + body)
            attachments: list of attachment metadata (from parse_eml)
            headers   : dict of parsed headers (from parse_eml)
        """
        text_lower = content.lower()
        lines = content.splitlines()
        attachments = attachments or []
        headers = headers or {}

        # ── Volume metrics ────────────────────────────────────────────────────
        total_length = len(content)
        word_count   = len(content.split())
        line_count   = len(lines)
        html_content = bool(re.search(
            r'<html|<body|<div|<a\s+href', content, re.IGNORECASE
        ))

        # ── URL extraction ────────────────────────────────────────────────────
        urls = URL_REGEX.findall(content)
        num_urls        = len(urls)
        num_http_urls   = sum(1 for u in urls if u.startswith('http://'))
        num_https_urls  = sum(1 for u in urls if u.startswith('https://'))
        href_text_mismatch = self._count_href_text_mismatches(content)
        obfuscated_urls = sum(1 for u in urls if '%' in u or u.count('-') > 5)

        # Shortened URLs
        shortened_urls = self._find_shortened_urls(urls)

        # Blacklisted domains in URLs
        blacklisted_url_domains = self._find_blacklisted_domains(urls + [content])

        link_to_text_ratio = num_urls / max(word_count, 1)

        # ── Urgency signals ───────────────────────────────────────────────────
        urgency_hits  = [w for w in URGENCY_WORDS if w in text_lower]
        urgency_score = len(urgency_hits)

        # ── Credential harvesting ─────────────────────────────────────────────
        credential_hits  = [p for p in CREDENTIAL_PHRASES if p in text_lower]
        credential_score = len(credential_hits)

        # ── Sender analysis ───────────────────────────────────────────────────
        from_header     = headers.get('From', '') or self._find_header(lines, 'from')
        reply_to_header = headers.get('Reply-To', '') or self._find_header(lines, 'reply-to')
        subject         = headers.get('Subject', '') or self._find_header(lines, 'subject')

        spoofed_brand       = any(b in from_header.lower() for b in SPOOFED_BRANDS)
        reply_to_differs    = bool(reply_to_header) and self._emails_differ(
            from_header, reply_to_header
        )
        domain_mismatch     = self._detect_display_name_domain_mismatch(from_header)
        sender_ip_in_from   = bool(re.search(
            r'From:.*<.*@\d+\.\d+\.\d+\.\d+>', from_header, re.IGNORECASE
        ))

        # ── SPF / DKIM / DMARC ───────────────────────────────────────────────
        auth_result  = headers.get('Authentication-Results', '') or ''
        received_spf = headers.get('Received-SPF', '') or ''
        dkim_sig     = headers.get('DKIM-Signature', '') or ''
        arc_auth     = headers.get('ARC-Authentication-Results', '') or ''

        combined_auth = ' '.join([auth_result, received_spf, arc_auth]).lower()

        spf_result  = self._extract_auth_result(combined_auth, 'spf')
        dkim_result = self._extract_auth_result(combined_auth, 'dkim')
        dmarc_result= self._extract_auth_result(combined_auth, 'dmarc')
        has_dkim    = bool(dkim_sig)

        spf_fail   = spf_result in ('fail', 'softfail', 'none', 'unknown')
        dkim_fail  = (not has_dkim) or dkim_result in ('fail', 'none', 'unknown')
        dmarc_fail = dmarc_result in ('fail', 'none', 'unknown')

        # ── Attachment analysis ───────────────────────────────────────────────
        has_attachment_hint = bool(attachments) or any(
            kw in text_lower for kw in
            ['attachment', 'attached', 'see attached', 'open the file',
             'download the file', 'find attached']
        )
        dangerous_attachments = [a for a in attachments if a.get('is_dangerous')]
        attachment_count = len(attachments)

        # ── Grammar / tone signals ─────────────────────────────────────────────
        words = content.split()
        caps_words  = [w for w in words if w.isupper() and len(w) > 2]
        caps_ratio  = len(caps_words) / max(len(words), 1)
        excessive_punct = len(EXCESSIVE_PUNCT_RE.findall(content))

        return {
            # Volume
            'length':               total_length,
            'word_count':           word_count,
            'line_count':           line_count,

            # URLs
            'num_urls':             num_urls,
            'num_http_urls':        num_http_urls,
            'num_https_urls':       num_https_urls,
            'obfuscated_urls':      obfuscated_urls,
            'href_text_mismatch':   href_text_mismatch,
            'shortened_urls':       shortened_urls,
            'shortened_url_count':  len(shortened_urls),
            'blacklisted_domains':  blacklisted_url_domains,
            'link_to_text_ratio':   round(link_to_text_ratio, 4),
            'extracted_urls':       urls[:15],

            # Risk signals
            'urgency_score':        urgency_score,
            'urgency_keywords':     urgency_hits[:8],
            'credential_score':     credential_score,
            'credential_keywords':  credential_hits[:3],

            # Sender
            'from_header':          from_header[:120],
            'reply_to_header':      reply_to_header[:120],
            'subject':              subject[:200],
            'spoofed_brand':        spoofed_brand,
            'reply_to_differs':     reply_to_differs,
            'domain_mismatch':      domain_mismatch,
            'sender_ip_in_from':    sender_ip_in_from,

            # Auth headers
            'spf_result':           spf_result,
            'dkim_result':          dkim_result,
            'dmarc_result':         dmarc_result,
            'has_dkim':             has_dkim,
            'spf_fail':             spf_fail,
            'dkim_fail':            dkim_fail,
            'dmarc_fail':           dmarc_fail,

            # Attachments
            'has_attachment_hint':  has_attachment_hint,
            'attachment_count':     attachment_count,
            'attachments':          attachments,
            'dangerous_attachments':dangerous_attachments,
            'has_dangerous_attachment': bool(dangerous_attachments),

            # Content flags
            'has_html':             html_content,
            'caps_ratio':           round(caps_ratio, 3),
            'excessive_punct':      excessive_punct,
        }

    def generate_indicators(self, features: dict, prediction: dict) -> list:
        """Return rich indicator dicts sorted by severity."""
        indicators = []

        # ── Critical ─────────────────────────────────────────────────────────
        if features.get('credential_score', 0) >= 1:
            kws = ', '.join(features.get('credential_keywords', []))
            indicators.append({
                'id': 'credential_harvest', 'severity': 'critical',
                'label': 'Credential Harvesting Language',
                'detail': f'Email requests sensitive credentials or personal information: {kws}',
                'category': 'content',
            })

        if features.get('href_text_mismatch', 0) > 0:
            indicators.append({
                'id': 'href_mismatch', 'severity': 'critical',
                'label': 'Link Text / Href URL Mismatch',
                'detail': (f"{features['href_text_mismatch']} link(s) display a "
                           "legitimate URL but point to a different destination — "
                           "classic phishing technique."),
                'category': 'urls',
            })

        if features.get('has_dangerous_attachment'):
            names = ', '.join(
                a['filename'] for a in features.get('dangerous_attachments', [])
            )
            indicators.append({
                'id': 'dangerous_attachment', 'severity': 'critical',
                'label': 'Dangerous Attachment Detected',
                'detail': f'Executable or macro-enabled file(s) attached: {names}',
                'category': 'attachments',
            })

        if prediction.get('probability', 0) > 0.7:
            indicators.append({
                'id': 'ml_flagged', 'severity': 'critical',
                'label': 'High Phishing Probability (ML Model)',
                'detail': f"Model confidence: {prediction['probability']:.1%}",
                'category': 'model',
            })

        # ── High ─────────────────────────────────────────────────────────────
        if features.get('spoofed_brand'):
            indicators.append({
                'id': 'sender_spoof', 'severity': 'high',
                'label': 'Sender Brand Spoofing',
                'detail': f"From header impersonates a known brand: {features.get('from_header', '')[:80]}",
                'category': 'sender',
            })

        if features.get('reply_to_differs'):
            indicators.append({
                'id': 'reply_to_mismatch', 'severity': 'high',
                'label': 'Reply-To / From Address Mismatch',
                'detail': 'Reply-To address differs from sender — replies go to a different, potentially malicious address.',
                'category': 'sender',
            })

        if features.get('domain_mismatch'):
            indicators.append({
                'id': 'domain_mismatch', 'severity': 'high',
                'label': 'Display Name / Domain Mismatch',
                'detail': 'The sender display name does not match the actual sending domain.',
                'category': 'sender',
            })

        if features.get('urgency_score', 0) >= 2:
            kws = ', '.join(features.get('urgency_keywords', []))
            indicators.append({
                'id': 'urgency_language', 'severity': 'high',
                'label': 'Urgency / Pressure Language',
                'detail': f"Detected {features['urgency_score']} urgency trigger(s): {kws}",
                'category': 'content',
            })

        if features.get('spf_fail') and features.get('spf_result') not in ('unknown', None, ''):
            indicators.append({
                'id': 'spf_fail', 'severity': 'high',
                'label': f"SPF Check Failed ({features.get('spf_result', 'fail').upper()})",
                'detail': 'SPF record indicates this email was not sent from an authorized server for this domain.',
                'category': 'authentication',
            })

        if features.get('dmarc_fail') and features.get('dmarc_result') not in ('unknown', None, ''):
            indicators.append({
                'id': 'dmarc_fail', 'severity': 'high',
                'label': f"DMARC Check Failed ({features.get('dmarc_result', 'fail').upper()})",
                'detail': 'DMARC policy failed — the email does not align with the domain owner\'s authentication policy.',
                'category': 'authentication',
            })

        if features.get('blacklisted_domains'):
            domains = ', '.join(features['blacklisted_domains'][:3])
            indicators.append({
                'id': 'blacklisted_domain', 'severity': 'high',
                'label': 'Known Phishing Domain Detected',
                'detail': f'Email contains links to blacklisted domain(s): {domains}',
                'category': 'urls',
            })

        if features.get('obfuscated_urls', 0) > 0:
            indicators.append({
                'id': 'obfuscated_urls', 'severity': 'high',
                'label': 'Obfuscated URLs',
                'detail': f"{features['obfuscated_urls']} URL(s) use percent-encoding or excessive hyphens to disguise their destination.",
                'category': 'urls',
            })

        # ── Medium ────────────────────────────────────────────────────────────
        if features.get('shortened_url_count', 0) > 0:
            urls = ', '.join(features.get('shortened_urls', [])[:3])
            indicators.append({
                'id': 'shortened_urls', 'severity': 'medium',
                'label': 'Shortened / Redirect URLs',
                'detail': f"{features['shortened_url_count']} URL shortener(s) found — final destination is hidden: {urls}",
                'category': 'urls',
            })

        if features.get('num_http_urls', 0) > 0:
            indicators.append({
                'id': 'insecure_links', 'severity': 'medium',
                'label': 'Insecure HTTP Links',
                'detail': f"{features['num_http_urls']} unencrypted HTTP link(s) found — data sent over these links is not protected.",
                'category': 'urls',
            })

        if features.get('dkim_fail') and not features.get('has_dkim'):
            indicators.append({
                'id': 'no_dkim', 'severity': 'medium',
                'label': 'No DKIM Signature',
                'detail': 'Email has no DKIM signature — cannot verify the message was not tampered with in transit.',
                'category': 'authentication',
            })

        if features.get('has_attachment_hint') and not features.get('has_dangerous_attachment'):
            count = features.get('attachment_count', 0)
            label = f"{count} attachment(s)" if count > 0 else "Attachment reference"
            indicators.append({
                'id': 'attachment_present', 'severity': 'medium',
                'label': 'Attachment Detected',
                'detail': f'{label} found. Do not open attachments from unverified senders.',
                'category': 'attachments',
            })

        if features.get('sender_ip_in_from'):
            indicators.append({
                'id': 'ip_sender', 'severity': 'medium',
                'label': 'Sender is Raw IP Address',
                'detail': 'The From header uses a raw IP address instead of a domain name — highly unusual for legitimate email.',
                'category': 'sender',
            })

        # ── Low ───────────────────────────────────────────────────────────────
        if features.get('caps_ratio', 0) > 0.15:
            indicators.append({
                'id': 'excessive_caps', 'severity': 'low',
                'label': 'Excessive Capitalization',
                'detail': f"{features['caps_ratio']:.0%} of words are fully capitalized — common pressure tactic.",
                'category': 'content',
            })

        if features.get('excessive_punct', 0) >= 2:
            indicators.append({
                'id': 'excessive_punct', 'severity': 'low',
                'label': 'Excessive Punctuation',
                'detail': f"{features['excessive_punct']} instance(s) of repeated !!! or ??? — typical urgency manipulation.",
                'category': 'content',
            })

        # ── Info / Safe signals ───────────────────────────────────────────────
        if features.get('num_urls', 0) == 0:
            indicators.append({
                'id': 'no_urls', 'severity': 'info',
                'label': 'No URLs Detected',
                'detail': 'Email contains no hyperlinks.',
                'category': 'urls',
            })

        return indicators

    def get_safe_indicators(self, features: dict) -> list:
        """Return list of positive / safe signals found in the email."""
        safe = []

        spf = features.get('spf_result', '')
        if spf == 'pass':
            safe.append({'label': 'SPF: Pass', 'detail': 'Sending server is authorized for this domain.'})

        dkim = features.get('dkim_result', '')
        if dkim == 'pass':
            safe.append({'label': 'DKIM: Pass', 'detail': 'Email signature is valid — message was not tampered in transit.'})

        dmarc = features.get('dmarc_result', '')
        if dmarc == 'pass':
            safe.append({'label': 'DMARC: Pass', 'detail': 'Domain authentication policy is satisfied.'})

        if not features.get('spoofed_brand'):
            safe.append({'label': 'No Brand Spoofing', 'detail': 'Sender does not appear to impersonate a known brand.'})

        if not features.get('reply_to_differs'):
            safe.append({'label': 'Reply-To Matches Sender', 'detail': 'Reply-To and From addresses are consistent.'})

        if features.get('num_https_urls', 0) > 0 and features.get('num_http_urls', 0) == 0:
            safe.append({'label': 'All Links Use HTTPS', 'detail': 'All links in this email use secure HTTPS connections.'})

        if features.get('urgency_score', 0) == 0:
            safe.append({'label': 'No Urgency Language', 'detail': 'No social-engineering pressure words detected.'})

        if features.get('credential_score', 0) == 0:
            safe.append({'label': 'No Credential Requests', 'detail': 'Email does not ask for passwords or sensitive data.'})

        if not features.get('has_attachment_hint'):
            safe.append({'label': 'No Attachments', 'detail': 'No file attachments detected in this email.'})

        return safe

    def get_recommended_actions(self, risk_label: str, features: dict) -> list:
        """Return prioritized recommended actions based on verdict."""
        actions = []

        if risk_label == 'phishing':
            actions = [
                {'priority': 'critical', 'icon': 'ban', 'action': 'Do Not Click Any Links',
                 'detail': 'This email contains highly suspicious links. Do not click anything.'},
                {'priority': 'critical', 'icon': 'trash', 'action': 'Delete This Email Immediately',
                 'detail': 'Remove this email from your inbox and empty the trash.'},
                {'priority': 'high', 'icon': 'shield', 'action': 'Report to Your IT / Security Team',
                 'detail': 'Forward the email (as an attachment) to your security team for investigation.'},
                {'priority': 'high', 'icon': 'flag', 'action': 'Mark as Spam / Phishing',
                 'detail': 'Use your email client\'s "Report Phishing" option to protect others.'},
                {'priority': 'medium', 'icon': 'user-x', 'action': 'Do Not Reply',
                 'detail': 'Replying confirms your address is active and may lead to further attacks.'},
            ]
        elif risk_label == 'suspicious':
            actions = [
                {'priority': 'high', 'icon': 'link-off', 'action': 'Do Not Click Unverified Links',
                 'detail': 'Hover over links to verify destinations before clicking anything.'},
                {'priority': 'high', 'icon': 'user-x', 'action': 'Do Not Reply Without Verification',
                 'detail': 'Contact the sender through a known, trusted channel to verify authenticity.'},
                {'priority': 'medium', 'icon': 'flag', 'action': 'Mark as Spam',
                 'detail': 'If you cannot verify the sender, mark as spam.'},
                {'priority': 'medium', 'icon': 'shield', 'action': 'Report if Confirmed Phishing',
                 'detail': 'If you verify this is phishing, report to your IT team.'},
            ]
        else:  # safe
            actions = [
                {'priority': 'info', 'icon': 'check-circle', 'action': 'Email Appears Safe',
                 'detail': 'No significant phishing indicators detected. Standard precautions still apply.'},
                {'priority': 'info', 'icon': 'eye', 'action': 'Always Verify Unexpected Requests',
                 'detail': 'Even safe-looking emails can be sophisticated. Verify unusual requests through another channel.'},
            ]

        if features.get('has_attachment_hint') or features.get('attachment_count', 0) > 0:
            actions.insert(0, {
                'priority': 'high', 'icon': 'paperclip',
                'action': 'Do Not Open Attachments Without Verification',
                'detail': 'Scan all attachments with antivirus before opening, even from known senders.',
            })

        return actions

    # ── Private helpers ───────────────────────────────────────────────────────

    def _find_header(self, lines: list, key: str) -> str:
        """Find a header value from raw email lines."""
        for line in lines:
            if line.lower().startswith(key.lower() + ':'):
                return line
        return ''

    def _is_dangerous_attachment(self, filename: str, mime_type: str) -> bool:
        if mime_type in DANGEROUS_MIME_TYPES:
            return True
        ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in RISKY_EXTENSIONS

    def _find_shortened_urls(self, urls: list) -> list:
        found = []
        for url in urls:
            try:
                host = urlparse(url).hostname or ''
                if host in SHORTENER_DOMAINS:
                    found.append(url)
            except Exception:
                pass
        return found

    def _find_blacklisted_domains(self, items: list) -> list:
        found = set()
        for item in items:
            for domain in BLACKLISTED_DOMAINS:
                if domain in item.lower():
                    found.add(domain)
        return list(found)

    def _extract_auth_result(self, auth_text: str, protocol: str) -> str:
        """Extract SPF/DKIM/DMARC result from Authentication-Results header."""
        pattern = re.compile(
            rf'{protocol}=(\w+)', re.IGNORECASE
        )
        m = pattern.search(auth_text)
        if m:
            return m.group(1).lower()
        return 'unknown'

    def _emails_differ(self, from_str: str, reply_to_str: str) -> bool:
        """Check if From and Reply-To contain different email addresses."""
        from_emails = EMAIL_ADDR_REGEX.findall(from_str)
        reply_emails = EMAIL_ADDR_REGEX.findall(reply_to_str)
        if not from_emails or not reply_emails:
            return False
        return from_emails[0].lower() != reply_emails[0].lower()

    def _detect_display_name_domain_mismatch(self, from_header: str) -> bool:
        """
        Detect when display name claims to be from one org but actual
        email domain is different. E.g. 'PayPal Support <user@evil.com>'
        """
        m = re.match(r'^([^<]+)<([^>]+)>', from_header.strip())
        if not m:
            return False
        display_name = m.group(1).strip().lower()
        actual_email = m.group(2).strip().lower()
        actual_domain = actual_email.split('@')[-1] if '@' in actual_email else ''

        for brand in SPOOFED_BRANDS:
            if brand in display_name and brand not in actual_domain:
                return True
        return False

    def _count_href_text_mismatches(self, content: str) -> int:
        """
        Count <a href="X">Y</a> tags where X and Y contain different domains.
        Classic phishing: show a legitimate URL but link to a malicious one.
        """
        count = 0
        pattern = re.compile(
            r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>', re.IGNORECASE
        )
        for m in pattern.finditer(content):
            href_domain = urlparse(m.group(1)).hostname or ''
            text = m.group(2).strip()
            text_domain = urlparse(text).hostname if text.startswith('http') else ''
            if href_domain and text_domain and href_domain != text_domain:
                count += 1
        return count
