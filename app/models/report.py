import uuid
from datetime import datetime, timezone
from app.extensions import db


class Report(db.Model):
    """Generated PDF or JSON report tied to a scan."""

    __tablename__ = 'reports'

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    scan_id = db.Column(
        db.String(36),
        db.ForeignKey('scans.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    report_type = db.Column(db.String(10), default='pdf')
    # 'pdf' or 'html' depending on whether WeasyPrint is installed

    file_path = db.Column(db.String(500), nullable=True)
    # Absolute path to the file on disk
    # In production swap this for a cloud storage URL (S3/GCS)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    downloaded_at = db.Column(db.DateTime(timezone=True), nullable=True)
    # Tracks when the user last downloaded this report

    def to_dict(self) -> dict:
        return {
            'id':             self.id,
            'scan_id':        self.scan_id,
            'user_id':        self.user_id,
            'report_type':    self.report_type,
            'created_at':     self.created_at.isoformat() if self.created_at else None,
            'downloaded_at':  self.downloaded_at.isoformat() if self.downloaded_at else None,
        }

    def __repr__(self) -> str:
        return f'<Report {self.id[:8]} scan={self.scan_id[:8]}>'


class ThreatCache(db.Model):
    """
    Cache for expensive external lookups.

    WHY CACHE?
    WHOIS:  500–2000ms per lookup
    SSL:    200–800ms per check
    If 50 users scan the same domain today, we only hit
    external APIs once. Every subsequent request is ~5ms.

    TTL strategy:
    - WHOIS data: cache 24 hours (domain registration rarely changes)
    - SSL certs:  cache 6 hours  (cert rotation is rare but possible)
    - IP rep:     cache 1 hour   (reputation can change faster)
    """

    __tablename__ = 'threat_cache'

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    indicator = db.Column(db.String(500), nullable=False, index=True)
    # The URL, domain name, or IP address being cached

    indicator_type = db.Column(db.String(20), nullable=False)
    # 'url', 'domain', or 'ip'

    threat_data = db.Column(db.JSON, default=dict)
    # The cached result — WHOIS dict, SSL dict, IP reputation dict

    cached_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    # When this cache entry should be considered stale

    @classmethod
    def get_valid(cls, indicator: str) -> 'ThreatCache | None':
        """
        Return a non-expired cache entry for this indicator.
        Returns None if not cached or if the entry has expired.
        """
        now = datetime.now(timezone.utc)
        return cls.query.filter(
            cls.indicator == indicator,
            cls.expires_at > now
        ).first()

    @classmethod
    def set(cls, indicator: str, indicator_type: str,
            data: dict, ttl_hours: int = 24) -> 'ThreatCache':
        """
        Store a new cache entry, replacing any existing one.

        ttl_hours controls how long the entry is valid:
        - Pass 24 for WHOIS data
        - Pass 6  for SSL cert data
        - Pass 1  for IP reputation data
        """
        from datetime import timedelta

        # Delete existing entry for this indicator if any
        cls.query.filter_by(indicator=indicator).delete()

        entry = cls(
            indicator      = indicator,
            indicator_type = indicator_type,
            threat_data    = data,
            expires_at     = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)
        )
        db.session.add(entry)
        db.session.commit()
        return entry

    def __repr__(self) -> str:
        return f'<ThreatCache {self.indicator_type}:{self.indicator[:30]}>'