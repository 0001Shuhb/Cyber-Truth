"""
AI Narrator Service — generates plain-English threat summaries.
Uses template-based generation (no external AI API required).
"""
from datetime import datetime


def _severity_intro(label: str, probability: float) -> str:
    pct = round(probability * 100, 1)
    if label == 'phishing':
        return f"⚠️ HIGH RISK — Cyber Truth has classified this with {pct}% phishing probability."
    elif pct >= 40:
        return f"🔶 SUSPICIOUS — Cyber Truth flagged this with {pct}% suspicion score. Manual review recommended."
    else:
        return f"✅ LOW RISK — Cyber Truth rated this {pct}% likely safe. No significant threats detected."


def _format_indicators(indicators: list) -> str:
    if not indicators:
        return "No significant threat indicators were detected."
    critical = [i for i in indicators if isinstance(i, dict) and i.get('severity') in ('critical',)]
    high     = [i for i in indicators if isinstance(i, dict) and i.get('severity') in ('high',)]
    others   = [i for i in indicators if isinstance(i, dict) and i.get('severity') not in ('critical', 'high')]

    lines = []
    if critical:
        lines.append("**Critical findings:**")
        for i in critical:
            lines.append(f"  • {i.get('label', '')}: {i.get('detail', '')}")
    if high:
        lines.append("**High-severity findings:**")
        for i in high:
            lines.append(f"  • {i.get('label', '')}: {i.get('detail', '')}")
    if others:
        lines.append("**Additional findings:**")
        for i in others[:4]:   # cap at 4 minor items
            lines.append(f"  • {i.get('label', '')}: {i.get('detail', '')}")
    return '\n'.join(lines)


def generate_url_narrative(url: str, prediction: dict, indicators: list) -> str:
    label = prediction.get('label', 'unknown')
    prob  = prediction.get('probability', 0.0)
    intro = _severity_intro(label, prob)
    ind_text = _format_indicators(indicators)

    # Recommendations based on verdict
    if label == 'phishing':
        rec = (
            "**Recommendations:** Do NOT visit this URL. Do not enter any credentials. "
            "Report this link to your security team and consider blocking the domain at the firewall level."
        )
    elif label == 'suspicious':
        rec = (
            "**Recommendations:** Exercise caution. Verify the URL with the legitimate organization "
            "through official channels before proceeding. Check the domain registration age and SSL certificate manually."
        )
    else:
        rec = (
            "**Recommendations:** URL appears safe based on current analysis. "
            "Always verify the sender before clicking links received via email or messaging apps."
        )

    return (
        f"{intro}\n\n"
        f"**Analyzed URL:** `{url}`\n\n"
        f"{ind_text}\n\n"
        f"{rec}\n\n"
        f"*Analysis timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*"
    )


def generate_email_narrative(content_snippet: str, prediction: dict, indicators: list) -> str:
    label = prediction.get('label', 'unknown')
    prob  = prediction.get('probability', 0.0)
    intro = _severity_intro(label, prob)
    ind_text = _format_indicators(indicators)

    if label == 'phishing':
        rec = (
            "**Recommendations:** Do NOT click any links or download attachments from this email. "
            "Do not provide any credentials or personal information. Report to your IT security team immediately. "
            "Mark as phishing in your email client."
        )
    elif label == 'suspicious':
        rec = (
            "**Recommendations:** Treat this email with caution. Verify the sender's identity "
            "through a separate communication channel. Do not click embedded links without verifying the destination."
        )
    else:
        rec = (
            "**Recommendations:** Email appears legitimate based on current analysis. "
            "Continue to apply standard email hygiene — verify sender identity and hover over links before clicking."
        )

    snippet_preview = content_snippet[:120].replace('\n', ' ') if content_snippet else ''

    return (
        f"{intro}\n\n"
        f"**Email preview:** \"{snippet_preview}...\"\n\n"
        f"{ind_text}\n\n"
        f"{rec}\n\n"
        f"*Analysis timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*"
    )


def generate_website_narrative(url: str, features: dict, prediction: dict, indicators: list) -> str:
    label = prediction.get('label', 'unknown')
    prob  = prediction.get('probability', 0.0)
    intro = _severity_intro(label, prob)
    ind_text = _format_indicators(indicators)

    # Technical summary from DOM analysis
    tech_parts = []
    if features.get('num_forms', 0) > 0:
        tech_parts.append(f"{features['num_forms']} form(s) detected")
    if features.get('password_inputs', 0) > 0:
        tech_parts.append(f"{features['password_inputs']} password field(s)")
    if features.get('num_redirects', 0) > 0:
        tech_parts.append(f"{features['num_redirects']} redirect(s)")
    if features.get('external_scripts', 0) > 0:
        tech_parts.append(f"{features['external_scripts']} external script(s)")
    tech_summary = ', '.join(tech_parts) if tech_parts else 'standard page structure'

    if label == 'phishing':
        rec = (
            "**Recommendations:** Do NOT interact with this website. Do not submit any forms or credentials. "
            "Close the tab immediately. Report the URL to your security team and consider submitting to Google Safe Browsing."
        )
    elif label == 'suspicious':
        rec = (
            "**Recommendations:** Proceed with caution. Verify the website is the legitimate destination "
            "by checking the domain carefully. Avoid submitting personal information."
        )
    else:
        rec = (
            "**Recommendations:** Website appears safe based on current scan. "
            "Always verify the site URL matches the organization's official domain before submitting credentials."
        )

    return (
        f"{intro}\n\n"
        f"**Scanned URL:** `{url}`\n"
        f"**Page structure:** {tech_summary}\n\n"
        f"{ind_text}\n\n"
        f"{rec}\n\n"
        f"*Analysis timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*"
    )
