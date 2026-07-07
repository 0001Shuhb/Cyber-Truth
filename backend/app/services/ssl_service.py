"""
SSL Certificate Service — checks SSL validity, expiry, and issuer.
"""
import ssl
import socket
from datetime import datetime, timezone
from urllib.parse import urlparse


class SSLService:
    TIMEOUT = 5

    def check(self, url: str) -> dict:
        """
        Connect to the host and retrieve the SSL certificate.
        Returns validity flag, expiry date, days remaining, and issuer.
        """
        result = {
            'valid':         False,
            'expired':       True,
            'days_remaining': None,
            'issuer':        None,
            'subject':       None,
            'not_before':    None,
            'not_after':     None,
            'error':         None,
        }

        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            port = parsed.port or 443

            if not hostname:
                result['error'] = 'invalid_hostname'
                return result

            if parsed.scheme != 'https':
                result['error'] = 'not_https'
                result['valid'] = False
                return result

            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=self.TIMEOUT) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()

            # Parse validity dates
            not_before_str = cert.get('notBefore', '')
            not_after_str  = cert.get('notAfter', '')

            not_before = datetime.strptime(not_before_str, '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc) if not_before_str else None
            not_after  = datetime.strptime(not_after_str,  '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc) if not_after_str  else None

            now = datetime.now(timezone.utc)
            if not_after:
                days_remaining = (not_after - now).days
                expired = days_remaining < 0
            else:
                days_remaining = None
                expired = True

            # Extract issuer and subject
            def _parse_rdns(rdns):
                d = {}
                for rdn in rdns:
                    for k, v in rdn:
                        d[k] = v
                return d

            issuer  = _parse_rdns(cert.get('issuer', []))
            subject = _parse_rdns(cert.get('subject', []))

            result.update({
                'valid':           not expired and (not_before is not None and not_after is not None),
                'expired':         expired,
                'days_remaining':  days_remaining,
                'not_before':      not_before.isoformat() if not_before else None,
                'not_after':       not_after.isoformat()  if not_after  else None,
                'issuer':          issuer.get('O') or issuer.get('CN', 'Unknown'),
                'subject':         subject.get('CN', hostname),
                'error':           None,
            })

        except ssl.SSLCertVerificationError as e:
            result['error'] = f'cert_verification_failed: {str(e)[:100]}'
        except ssl.SSLError as e:
            result['error'] = f'ssl_error: {str(e)[:100]}'
        except socket.timeout:
            result['error'] = 'connection_timeout'
        except ConnectionRefusedError:
            result['error'] = 'connection_refused'
        except Exception as e:
            result['error'] = str(e)[:100]

        return result
