# app/services/threat_news.py
"""
Threat Intelligence News Aggregator
====================================
Fetches, normalizes, deduplicates, caches, and enriches
cybersecurity threat intelligence from multiple trusted RSS feeds
and public APIs. Designed to run on every /api/intel/news request
with an in-memory cache to avoid hammering external sources.

Sources:
- CISA Advisories (US-CERT)
- CISA Known Exploited Vulnerabilities (JSON API)
- The Hacker News RSS
- Krebs on Security RSS
- Bleeping Computer RSS
- Dark Reading RSS
- The Record by Recorded Future RSS
- Security Week RSS
- Naked Security by Sophos RSS
- Cisco Talos Intelligence Blog RSS
- SANS Internet Storm Center RSS
- Threatpost RSS
"""

import re
import time
import json
import hashlib
import threading
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Optional

# ─── In-Memory Cache ──────────────────────────────────────────────────────────

_cache_lock = threading.Lock()
_cached_articles: List[Dict] = []
_cache_timestamp: float = 0.0
CACHE_TTL_SECONDS = 720  # 12 minutes

# ─── Feed Sources ─────────────────────────────────────────────────────────────

RSS_FEEDS = {
    "cisa_advisories": {
        "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        "category": "Advisories",
        "country": "US",
        "source_label": "CISA Advisories"
    },
    "hacker_news": {
        "url": "https://feeds.feedburner.com/TheHackerNews",
        "category": "Malware & Breaches",
        "country": "Global",
        "source_label": "The Hacker News"
    },
    "krebs_on_security": {
        "url": "https://krebsonsecurity.com/feed/",
        "category": "Threat Research",
        "country": "US",
        "source_label": "Krebs on Security"
    },
    "bleeping_computer": {
        "url": "https://www.bleepingcomputer.com/feed/",
        "category": "Malware & Breaches",
        "country": "Global",
        "source_label": "Bleeping Computer"
    },
    "dark_reading": {
        "url": "https://www.darkreading.com/rss.xml",
        "category": "Threat Research",
        "country": "US",
        "source_label": "Dark Reading"
    },
    "the_record": {
        "url": "https://therecord.media/feed",
        "category": "Threat Intelligence",
        "country": "Global",
        "source_label": "The Record"
    },
    "securityweek": {
        "url": "https://feeds.feedburner.com/Securityweek",
        "category": "Vulnerabilities",
        "country": "Global",
        "source_label": "SecurityWeek"
    },
    "sans_isc": {
        "url": "https://isc.sans.edu/rssfeed_full.xml",
        "category": "Threat Intelligence",
        "country": "Global",
        "source_label": "SANS Internet Storm Center"
    },
    "naked_security": {
        "url": "https://nakedsecurity.sophos.com/feed/",
        "category": "Malware & Breaches",
        "country": "Global",
        "source_label": "Naked Security (Sophos)"
    },
    "cisco_talos": {
        "url": "https://blog.talosintelligence.com/feeds/posts/default",
        "category": "Threat Research",
        "country": "Global",
        "source_label": "Cisco Talos"
    },
    "threatpost": {
        "url": "https://threatpost.com/feed/",
        "category": "Vulnerabilities",
        "country": "Global",
        "source_label": "Threatpost"
    },
    "graham_cluley": {
        "url": "https://grahamcluley.com/feed/",
        "category": "Malware & Breaches",
        "country": "Global",
        "source_label": "Graham Cluley"
    },
}

# CISA Known Exploited Vulnerabilities — JSON API (no key required)
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

# ─── Keyword Lists for Enrichment ────────────────────────────────────────────

ORGANIZATIONS = [
    "Microsoft", "Google", "Apple", "Cisco", "Fortinet", "Ivanti", "VMware",
    "Apache", "Linux", "Atlassian", "Citrix", "Palo Alto Networks", "Oracle",
    "IBM", "F5", "Zoom", "AWS", "GitHub", "SolarWinds", "Trellix", "Trend Micro",
    "MOVEit", "Barracuda", "JetBrains", "Progress Software", "MOVEit Transfer",
    "Juniper", "Cisco IOS", "Aruba", "Qualcomm", "Samsung", "Adobe", "SAP",
    "Confluence", "Jira", "GitLab", "PaperCut", "Zimbra", "OpenSSL", "Spring",
]

MALWARE = [
    "Cobalt Strike", "LockBit", "BlackCat", "ALPHV", "Clop", "Qakbot", "Emotet",
    "Agent Tesla", "RedLine Stealer", "SocGholish", "Lumina", "Medusa", "Akira",
    "RansomHouse", "AsyncRAT", "DarkGate", "Bumblebee", "Remcos", "SpyNote",
    "Lazarus", "PlugX", "Volt Typhoon", "APT29", "APT41", "Sandworm", "BlackMatter",
    "Hive", "Vice Society", "Royal Ransomware", "Play Ransomware", "NoEscape",
    "Rhysida", "IcedID", "SystemBC", "Pikabot", "GuLoader", "Vidar",
]

ATTACK_TYPES = [
    ("Ransomware",                  ["ransomware", "encrypt", "extortion", "ransom"]),
    ("Zero-Day Exploit",            ["zero-day", "0-day", "unpatched", "active exploitation", "actively exploited"]),
    ("Remote Code Execution",       ["rce", "remote code execution", "code execution", "arbitrary code"]),
    ("Phishing / Social Engineering", ["phishing", "social engineering", "credential harvesting", "spoof", "bec"]),
    ("Data Breach / Exfiltration",  ["data breach", "exfiltration", "data theft", "leaked", "compromised", "stolen"]),
    ("Denial of Service",           ["dos", "ddos", "denial of service", "exhaustion"]),
    ("Privilege Escalation",        ["privilege escalation", "elevation of privilege", "sandbox escape"]),
    ("Supply Chain Attack",         ["supply chain", "software supply", "dependency confusion"]),
    ("Authentication Bypass",       ["authentication bypass", "auth bypass", "bypass authentication"]),
    ("SQL Injection",               ["sql injection", "sqli", "database injection"]),
]

MITRE_TECHNIQUES = [
    ("T1566 (Phishing)",                    ["phishing", "email attachment", "malicious link", "spear-phishing"]),
    ("T1203 (Client Execution Exploit)",    ["rce", "code execution", "buffer overflow", "vulnerability exploitation"]),
    ("T1486 (Data Encrypted for Impact)",   ["ransomware", "encrypting", "locked files", "encrypt"]),
    ("T1190 (Exploit Public-Facing App)",   ["external-facing", "web server", "sql injection", "public facing"]),
    ("T1588.006 (Obtain Vulnerabilities)",  ["cve-", "flaw", "weakness", "zero-day"]),
    ("T1133 (External Remote Services)",    ["vpn", "rdp", "remote desktop", "ssh", "citrix"]),
    ("T1078 (Valid Accounts)",              ["stolen credentials", "default password", "credential", "account takeover"]),
    ("T1595 (Active Scanning)",             ["scanning", "reconnaissance", "enumeration", "shodan"]),
    ("T1071 (Application Layer Protocol)", ["c2", "command and control", "c&c", "botnet"]),
    ("T1486 (Supply Chain Compromise)",     ["supply chain", "third-party", "software update"]),
]

SEVERITY_CRITICAL = ["critical", "cvss 10", "cvss 9.8", "cvss 9.9", "rce", "zero-day",
                      "actively exploited", "ransomware", "root exploit", "full system compromise",
                      "remote code execution", "wormable"]
SEVERITY_HIGH     = ["high", "cvss 9", "cvss 8", "exploit", "compromise", "breach",
                      "data theft", "malware", "backdoor", "keylogger", "credential theft"]
SEVERITY_LOW      = ["low", "minor", "informational", "warning", "advisory"]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_id(value: str) -> str:
    """Stable MD5 hash for deduplication."""
    return hashlib.md5(value.encode("utf-8", errors="replace")).hexdigest()


def _clean_html(text: str) -> str:
    """Strip HTML tags and normalize whitespace."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&#\d+;", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _parse_date(date_str: str) -> str:
    """Try multiple date formats, fall back to now."""
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    
    # Normalize timezone abbreviations
    date_str = date_str.strip()
    date_str = re.sub(r"\s+GMT$", " +0000", date_str)
    date_str = re.sub(r"\s+UTC$", " +0000", date_str)
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except (ValueError, TypeError):
            continue
    
    return datetime.now(timezone.utc).isoformat()


def _enrich_article(article: Dict) -> Dict:
    """
    Enrich a raw article dict with NLP-based classifications:
    severity, attack type, MITRE techniques, malware, orgs, CVEs.
    """
    title = article.get("title", "") or ""
    description = article.get("description", "") or ""
    text = f"{title} {description}".lower()

    # CVE detection
    cves = list(set(re.findall(r"cve-\d{4}-\d{4,7}", text)))
    cves = [c.upper() for c in cves]

    # Organization detection
    affected_orgs = [org for org in ORGANIZATIONS if org.lower() in text]

    # Malware detection
    detected_malware = [m for m in MALWARE if m.lower() in text]

    # Attack type classification (first match wins)
    attack_type = "Threat Advisory"
    for type_name, keywords in ATTACK_TYPES:
        if any(kw in text for kw in keywords):
            attack_type = type_name
            break

    # MITRE ATT&CK mapping (all matches)
    mitre = [tech for tech, kws in MITRE_TECHNIQUES if any(kw in text for kw in kws)]

    # Severity scoring
    severity = "Medium"
    if any(kw in text for kw in SEVERITY_CRITICAL):
        severity = "Critical"
    elif any(kw in text for kw in SEVERITY_HIGH):
        severity = "High"
    elif any(kw in text for kw in SEVERITY_LOW):
        severity = "Low"

    # AI-style summary generation
    parts = [f"Threat Brief: {title}."]
    if affected_orgs:
        parts.append(f"Affected entities: {', '.join(affected_orgs[:3])}.")
    if detected_malware:
        parts.append(f"Malware indicators: {', '.join(detected_malware[:3])}.")
    if cves:
        parts.append(f"Tracked vulnerabilities: {', '.join(cves[:3])}.")
    parts.append(
        f"Primary attack vector: {attack_type}. "
        "Recommended actions: apply available patches, enforce MFA, "
        "monitor network egress, and update IOC blocklists."
    )
    ai_summary = " ".join(parts)

    enriched = dict(article)
    enriched.update({
        "id":               article.get("id") or _make_id(article.get("link") or title),
        "description":      description or title,
        "ai_summary":       ai_summary,
        "cves":             cves,
        "affected_orgs":    affected_orgs,
        "malware":          detected_malware,
        "attack_type":      attack_type,
        "mitre_techniques": mitre,
        "severity":         severity,
    })
    return enriched


# ─── RSS Feed Fetcher ─────────────────────────────────────────────────────────

def _fetch_rss(feed_key: str, feed_config: Dict) -> List[Dict]:
    """Fetch and parse one RSS/Atom feed."""
    items: List[Dict] = []
    headers = {
        "User-Agent": "CyberTruth/1.0 Threat-Intelligence-Aggregator",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
    }

    try:
        req = urllib.request.Request(feed_config["url"], headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read()
    except Exception as exc:
        print(f"[ThreatNews] RSS fetch failed for {feed_key}: {exc}")
        return items

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        print(f"[ThreatNews] XML parse error for {feed_key}: {exc}")
        return items

    # Handle both RSS <channel><item> and Atom <entry>
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    channel = root.find("channel")

    if channel is not None:
        feed_items = channel.findall("item")
    else:
        # Atom feed
        feed_items = root.findall("atom:entry", ns) or root.findall(".//item")

    for item in feed_items[:12]:
        def _text(tag: str, default: str = "") -> str:
            node = item.find(tag)
            if node is None:
                # Try with atom namespace
                node = item.find(f"atom:{tag}", ns)
            if node is not None and node.text:
                return node.text.strip()
            return default

        title       = _clean_html(_text("title", "No Title"))
        link        = _text("link") or _text("guid") or ""
        description = _clean_html(_text("description") or _text("summary") or _text("content") or "")
        pub_date    = _parse_date(_text("pubDate") or _text("updated") or _text("published") or "")

        if not title or title == "No Title":
            continue

        # Truncate long descriptions
        if len(description) > 500:
            description = description[:497] + "..."

        items.append({
            "title":        title,
            "link":         link,
            "description":  description,
            "published_at": pub_date,
            "source":       feed_config["source_label"],
            "category":     feed_config["category"],
            "country":      feed_config["country"],
        })

    return items


# ─── CISA KEV JSON Fetcher ────────────────────────────────────────────────────

def _fetch_cisa_kev() -> List[Dict]:
    """
    Fetch the CISA Known Exploited Vulnerabilities (KEV) catalog.
    Returns the 15 most recently added entries as threat articles.
    """
    items: List[Dict] = []
    headers = {"User-Agent": "CyberTruth/1.0 Threat-Intelligence-Aggregator"}
    try:
        req = urllib.request.Request(CISA_KEV_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())

        vulns = data.get("vulnerabilities", [])
        # Sort by dateAdded descending
        vulns.sort(key=lambda v: v.get("dateAdded", ""), reverse=True)

        for v in vulns[:15]:
            cve_id      = v.get("cveID", "")
            vendor      = v.get("vendorProject", "Unknown")
            product     = v.get("product", "Unknown")
            vuln_name   = v.get("vulnerabilityName", "Unknown Vulnerability")
            description = v.get("shortDescription", "") or f"Known exploited vulnerability affecting {vendor} {product}."
            date_added  = v.get("dateAdded", "")
            due_date    = v.get("dueDate", "")
            required_action = v.get("requiredAction", "Apply vendor patch immediately.")

            title = f"{cve_id}: {vuln_name} ({vendor} {product})"
            pub_date = _parse_date(date_added) if date_added else datetime.now(timezone.utc).isoformat()

            desc_full = (
                f"{description} "
                f"Required action: {required_action} "
                f"Patch due: {due_date}."
            )

            items.append({
                "title":        title,
                "link":         f"https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
                "description":  desc_full[:500],
                "published_at": pub_date,
                "source":       "CISA KEV Catalog",
                "category":     "Known Exploited Vulnerabilities",
                "country":      "US",
                "cves":         [cve_id] if cve_id else [],
                "severity":     "Critical",   # All KEV entries are actively exploited
                "attack_type":  "Known Exploited Vulnerability",
            })
    except Exception as exc:
        print(f"[ThreatNews] CISA KEV fetch failed: {exc}")

    return items


# ─── Deduplication ────────────────────────────────────────────────────────────

def _deduplicate(articles: List[Dict]) -> List[Dict]:
    """Remove duplicate articles by title similarity (MD5 of lowercase title)."""
    seen = set()
    unique = []
    for art in articles:
        title_key = _make_id(art.get("title", "").lower().strip())
        if title_key not in seen:
            seen.add(title_key)
            unique.append(art)
    return unique


# ─── Public API ──────────────────────────────────────────────────────────────

def get_threat_intelligence_news(force_refresh: bool = False) -> List[Dict]:
    """
    Aggregate, enrich, deduplicate and cache threat intel from all sources.

    Args:
        force_refresh: Bypass the cache and re-fetch from all sources.

    Returns:
        List of enriched article dicts, sorted newest-first.
    """
    global _cached_articles, _cache_timestamp

    with _cache_lock:
        now = time.monotonic()
        if not force_refresh and _cached_articles and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
            print(f"[ThreatNews] Serving {len(_cached_articles)} cached articles "
                  f"(age: {int(now - _cache_timestamp)}s)")
            return list(_cached_articles)

    # ── Fetch from all sources in sequence ────────────────────────────────────
    # (For production, parallelize with ThreadPoolExecutor)
    raw_articles: List[Dict] = []

    # RSS feeds
    for feed_key, feed_config in RSS_FEEDS.items():
        feed_items = _fetch_rss(feed_key, feed_config)
        raw_articles.extend(feed_items)
        print(f"[ThreatNews] {feed_key}: {len(feed_items)} items")

    # CISA KEV JSON API
    kev_items = _fetch_cisa_kev()
    raw_articles.extend(kev_items)
    print(f"[ThreatNews] cisa_kev: {len(kev_items)} items")

    # ── Enrich all articles ───────────────────────────────────────────────────
    enriched = []
    for article in raw_articles:
        try:
            enriched.append(_enrich_article(article))
        except Exception as exc:
            print(f"[ThreatNews] Enrichment failed for article: {exc}")

    # ── Deduplicate ───────────────────────────────────────────────────────────
    unique = _deduplicate(enriched)

    # ── Sort newest-first ─────────────────────────────────────────────────────
    unique.sort(key=lambda a: a.get("published_at", ""), reverse=True)

    print(f"[ThreatNews] Total unique articles: {len(unique)} (from {len(raw_articles)} raw)")

    # ── Update cache ──────────────────────────────────────────────────────────
    with _cache_lock:
        _cached_articles = unique
        _cache_timestamp = time.monotonic()

    return list(unique)


def invalidate_cache():
    """Force the next call to re-fetch all sources."""
    global _cache_timestamp
    with _cache_lock:
        _cache_timestamp = 0.0
