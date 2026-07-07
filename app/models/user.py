import uuid
from datetime import datetime, timezone
from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    scan_count = db.Column(db.Integer, default=0, nullable=False)

    # Relationships
    scans = db.relationship(
        'Scan',
        backref='user',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    reports = db.relationship(
        'Report',
        backref='user',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def set_password(self, raw_password: str) -> None:
        """
        Hash raw password with bcrypt cost factor 12.
        Salt is auto-generated and embedded in the hash string.
        NEVER store raw passwords.
        """
        self.password_hash = bcrypt.generate_password_hash(
            raw_password,
            rounds=12
        ).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        """
        Constant-time comparison against stored hash.
        Prevents timing attacks.
        """
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def update_last_login(self) -> None:
        self.last_login = datetime.now(timezone.utc)
        db.session.commit()

    def to_dict(self, include_private: bool = False) -> dict:
        data = {
            'id':         self.id,
            'username':   self.username,
            'role':       self.role,
            'is_active':  self.is_active,
            'scan_count': self.scan_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }
        if include_private:
            data['email'] = self.email
        return data

    def __repr__(self) -> str:
        return f'<User {self.username} ({self.role})>'