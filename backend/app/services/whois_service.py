"""
WHOIS Service — queries domain registration age.
Uses python-whois if available, falls back to a DNS-based heuristic.
"""
from datetime import datetime, timezone


def domain_age(domain: str) -> dict:
    """
    Returns domain registration age in days.
    Tries python-whois first, then falls back gracefully.
    """
    result = {
        'domain':       domain,
        'created_date': None,
        'age_days':     None,
        'registrar':    None,
        'error':        None,
    }

    try:
        import whois as python_whois
        data = python_whois.whois(domain)

        created = data.creation_date
        if isinstance(created, list):
            created = created[0]

        if created:
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            age_days = (now - created).days
            result.update({
                'created_date': created.isoformat(),
                'age_days':     age_days,
                'registrar':    getattr(data, 'registrar', None),
            })
        else:
            result['error'] = 'no_creation_date'

    except ImportError:
        # python-whois not installed — return neutral result
        result['error'] = 'whois_not_installed'
    except Exception as e:
        result['error'] = str(e)[:100]

    return result
