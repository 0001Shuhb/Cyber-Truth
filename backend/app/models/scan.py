# app/models/scan.py
"""
Scan model — stores every phishing analysis result.

The 'indicators' and 'raw_features' columns use JSON storage.
SQLite stores JSON as text; PostgreSQL has a native JSONB type.
SQLAlchemy handles this transparently with db.JSON.

WHY store raw_features?
Explainability. When a user asks "why is this flagged?", we can
show them the exact feature values the model used to decide.
This is called XAI (Explainable AI) and is critically important
in security tooling where decisions have consequences.
"""

import uuid
from datetime import datetime, timezone
from ..extensions import db


class Scan(db.Model):
    """A single phishing analysis scan result."""

    __tablename__ = 'scans'

    # Primary key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key links this scan to a user
    # ondelete='CASCADE' means if the user is deleted, their scans are too
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True  # We frequently query scans by user_id
    )

    # What kind of scan was this?
    scan_type = db.Column(
        db.String(20),
        nullable=False
        # Values: 'url', 'email', 'website'
    )

    # The raw input submitted by the user.
    # Text type (unlimited length) to handle long email bodies.
    # SECURITY NOTE: This is stored raw. If rendered in HTML, always escape it.
    input_data = db.Column(db.Text, nullable=False)

    # Risk score from 0.0 to 1.0.
    # 0.0 = definitely safe, 1.0 = definitely phishing.
    # We multiply by 100 for display purposes.
    risk_score = db.Column(db.Float, nullable=False)

    # Human-readable verdict
    risk_label = db.Column(
        db.String(20),
        nullable=False
        # Values: 'safe', 'suspicious', 'phishing'
    )

    # JSON array of triggered phishing indicators.
    # Example: [{"title": "Homograph Attack", "severity": "critical", "description": "..."}]
    indicators = db.Column(db.JSON, default=list)

    # Plain-English AI-generated explanation of the result.
    ai_analysis = db.Column(db.Text, nullable=True)
    # Celery task id for the async AI narrative (optional)
    ai_task_id = db.Column(db.String(100), nullable=True)

    # JSON object of the 28 extracted features.
    # Example: {"url_length": 87, "entropy": 4.82, "has_ip": false, ...}
    # Stored for explainability and model retraining.
    raw_features = db.Column(db.JSON, default=dict)

    # Which model version produced this result.
    # When you retrain the model, existing results are linked to the old version.
    model_version = db.Column(db.String(20), default='1.0.0')

    # How long the scan took (milliseconds). Used for performance monitoring.
    scan_duration_ms = db.Column(db.Integer, nullable=True)

    # IP address of the requester. For audit trails and abuse detection.
    # GDPR NOTE: In EU deployments, IP addresses are personal data.
    # Consider hashing or truncating (e.g., 192.168.1.x) for compliance.
    ip_address = db.Column(db.String(45), nullable=True)  # 45 chars covers IPv6

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True  # We frequently sort/filter by creation time
    )

    # ==================================================
    # Relationships
    # ==================================================
    reports = db.relationship('Report', backref='scan', lazy='dynamic')

    # ==================================================
    # Class Methods (query helpers)
    # ==================================================

    @classmethod
    def get_user_stats(cls, user_id: str) -> dict:
        """Return summary statistics for a user's scan history."""
        from sqlalchemy import func

        total   = cls.query.filter_by(user_id=user_id).count()
        safe    = cls.query.filter_by(user_id=user_id, risk_label='safe').count()
        suspicious = cls.query.filter_by(user_id=user_id, risk_label='suspicious').count()
        phishing   = cls.query.filter_by(user_id=user_id, risk_label='phishing').count()

        avg_score = db.session.query(func.avg(cls.risk_score)).filter(
            cls.user_id == user_id
        ).scalar() or 0.0

        return {
            'total': total,
            'safe': safe,
            'suspicious': suspicious,
            'phishing': phishing,
            'avg_risk_score': round(avg_score * 100, 1),
        }

    # ==================================================
    # Serialization
    # ==================================================

    def to_dict(self, full: bool = False) -> dict:
        """
        Serialize scan to dict.
        full=True includes raw_features and full indicators (for report pages).
        full=False returns summary (for history table rows).
        """
        data = {
            'id':             self.id,
            'scan_type':      self.scan_type,
            'input_data':     self.input_data[:100] + '...' if len(self.input_data) > 100 else self.input_data,
            'risk_score':     round(self.risk_score * 100, 1),  # Convert 0-1 to 0-100
            'risk_label':     self.risk_label,
            'model_version':  self.model_version,
            'scan_duration_ms': self.scan_duration_ms,
            'created_at':     self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            data.update({
                'input_data':   self.input_data,   # Full input for report
                'indicators':   self.indicators,
                'ai_analysis':  self.ai_analysis,
                'raw_features': self.raw_features,
            })
        return data

    def __repr__(self) -> str:
        return f'<Scan {self.id[:8]} {self.scan_type} {self.risk_label}>'