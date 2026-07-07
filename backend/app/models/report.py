# app/models/report.py
import uuid
from datetime import datetime, timezone
from ..extensions import db


class Report(db.Model):
    """A generated PDF or JSON report for a scan."""

    __tablename__ = 'reports'

    id          = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id     = db.Column(db.String(36), db.ForeignKey('scans.id', ondelete='CASCADE'), nullable=False)
    user_id     = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    report_type = db.Column(db.String(10), default='pdf')   # 'pdf' or 'json'
    file_path   = db.Column(db.String(500), nullable=True)  # Where the PDF is on disk
    created_at  = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    downloaded_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            'id':             self.id,
            'scan_id':        self.scan_id,
            'report_type':    self.report_type,
            'created_at':     self.created_at.isoformat(),
            'downloaded_at':  self.downloaded_at.isoformat() if self.downloaded_at else None,
        }


class ThreatCache(db.Model):
    """
    Cache for expensive external lookups (WHOIS, SSL, IP reputation).

    WHY CACHE?
    A WHOIS lookup takes 500-2000ms. If 50 users scan the same URL today,
    we'd waste 25-100 seconds of cumulative wait time. The cache serves
    results instantly after the first lookup.

    TTL (Time-To-Live): Domain registration data changes rarely, so
    we cache WHOIS for 24 hours. SSL certs change rarely too (90-day
    issuance cycle), so we cache those for 6 hours.
    """

    __tablename__ = 'threat_cache'

    id             = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator      = db.Column(db.String(500), nullable=False, index=True)  # The URL/domain/IP
    indicator_type = db.Column(db.String(20), nullable=False)               # 'url', 'domain', 'ip'
    threat_data    = db.Column(db.JSON, default=dict)
    cached_at      = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at     = db.Column(db.DateTime(timezone=True), nullable=False)

    @classmethod
    def get_valid(cls, indicator: str) -> 'ThreatCache | None':
        """Return cached data if it exists and hasn't expired."""
        now = datetime.now(timezone.utc)
        return cls.query.filter(
            cls.indicator == indicator,
            cls.expires_at > now
        ).first()

    def __repr__(self) -> str:
        return f'<ThreatCache {self.indicator_type}:{self.indicator[:30]}>'