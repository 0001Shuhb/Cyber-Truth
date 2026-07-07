"""
ML Engine — heuristic scoring model for phishing detection.
Uses weighted feature scoring until a trained model is available.
"""


class MLEngine:
    """
    Weighted heuristic scoring engine.
    Each feature contributes a weight toward a 0.0–1.0 phishing probability.
    Scores are calibrated so:
      < 0.35  → safe
      0.35–0.65 → suspicious
      > 0.65  → phishing
    """

    version = '1.2.0-heuristic'

    # ---- URL feature weights (positive = more suspicious) ----
    URL_WEIGHTS = {
        'has_https':             -0.25,   # HTTPS is a good signal
        'is_suspicious_tld':      0.30,
        'brand_in_url':           0.25,
        'has_non_standard_port':  0.20,
        'has_fragment':           0.05,
        'reply_to_differs':       0.15,   # shared with email
    }

    def _clamp(self, value: float) -> float:
        return max(0.0, min(1.0, value))

    def predict_url(self, features: dict) -> dict:
        score = 0.10   # base prior (assume slightly suspicious)

        # Boolean features
        for feat, weight in self.URL_WEIGHTS.items():
            if features.get(feat):
                score += weight

        # Numeric features
        url_len = features.get('length', 0)
        if url_len > 75:
            score += 0.10
        if url_len > 120:
            score += 0.10

        score += min(features.get('subdomain_count', 0) * 0.08, 0.24)
        score += min(features.get('phishing_patterns', 0) * 0.20, 0.40)
        score += min(features.get('num_hyphens', 0) * 0.04, 0.12)
        score += min(features.get('encoded_chars', 0) * 0.03, 0.09)

        entropy = features.get('domain_entropy', 0)
        if entropy > 3.8:
            score += 0.15
        elif entropy > 3.2:
            score += 0.07

        # WHOIS age
        whois = features.get('whois', {})
        if isinstance(whois, dict):
            age = whois.get('age_days')
            if age is not None:
                if age < 7:
                    score += 0.35
                elif age < 30:
                    score += 0.20
                elif age < 90:
                    score += 0.10

        # SSL
        ssl = features.get('ssl', {})
        if isinstance(ssl, dict) and not ssl.get('valid', True):
            score += 0.20

        prob = self._clamp(score)
        label = 'phishing' if prob > 0.65 else 'suspicious' if prob > 0.35 else 'safe'
        return {'probability': round(prob, 4), 'label': label}

    def predict_email(self, features: dict) -> dict:
        score = 0.05   # base prior

        # Urgency / credential signals
        score += min(features.get('urgency_score', 0) * 0.08, 0.32)
        score += min(features.get('credential_score', 0) * 0.20, 0.40)

        if features.get('spoofed_brand'):
            score += 0.25
        if features.get('reply_to_differs'):
            score += 0.20
        if features.get('domain_mismatch'):
            score += 0.20
        if features.get('sender_ip_in_from'):
            score += 0.25
        if features.get('href_text_mismatch', 0) > 0:
            score += 0.25
        if features.get('obfuscated_urls', 0) > 0:
            score += 0.20
        if features.get('num_http_urls', 0) > 0:
            score += 0.10
        if features.get('caps_ratio', 0) > 0.15:
            score += 0.05
        if features.get('has_dangerous_attachment'):
            score += 0.30
        elif features.get('has_attachment_hint'):
            score += 0.08

        # SPF / DKIM / DMARC failures
        if features.get('spf_fail') and features.get('spf_result') not in ('unknown', None, ''):
            score += 0.20
        if features.get('dkim_fail') and not features.get('has_dkim'):
            score += 0.10
        if features.get('dmarc_fail') and features.get('dmarc_result') not in ('unknown', None, ''):
            score += 0.20

        # Shortened / blacklisted URLs
        score += min(features.get('shortened_url_count', 0) * 0.10, 0.20)
        if features.get('blacklisted_domains'):
            score += 0.40

        # No URLs at all can be slightly safer
        if features.get('num_urls', 0) == 0:
            score -= 0.05

        # Link density
        link_ratio = features.get('link_to_text_ratio', 0)
        if link_ratio > 0.05:
            score += 0.10

        # Grammar signals
        if features.get('excessive_punct', 0) >= 3:
            score += 0.05

        prob = self._clamp(score)
        label = 'phishing' if prob > 0.65 else 'suspicious' if prob > 0.35 else 'safe'
        return {'probability': round(prob, 4), 'label': label}

    def predict_website(self, features: dict) -> dict:
        score = 0.05   # base prior

        if features.get('password_inputs', 0) > 0:
            score += 0.20
        if features.get('external_form_actions', 0) > 0:
            score += 0.35
        if features.get('obfuscated_scripts', 0) > 0:
            score += 0.30
        if features.get('hidden_iframes', 0) > 0:
            score += 0.30
        if features.get('has_meta_refresh'):
            score += 0.15
        if features.get('domain_changed'):
            score += 0.20
        if features.get('num_redirects', 0) > 3:
            score += 0.10
        if not features.get('has_csp'):
            score += 0.05
        if not features.get('has_hsts'):
            score += 0.05
        if not features.get('has_copyright'):
            score += 0.05
        if not features.get('has_favicon'):
            score += 0.05

        # SSL result
        ssl = features.get('ssl', {})
        if isinstance(ssl, dict) and not ssl.get('valid', True):
            score += 0.20

        # HTTP error on page fetch
        status = features.get('status_code')
        if status and status >= 400:
            score += 0.10

        prob = self._clamp(score)
        label = 'phishing' if prob > 0.65 else 'suspicious' if prob > 0.35 else 'safe'
        return {'probability': round(prob, 4), 'label': label}
