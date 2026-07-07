# app/models/user.py
"""
User model — represents a registered account.

Security principles enforced here:
1. Passwords are NEVER stored. Only bcrypt hashes.
2. UUIDs as primary keys — harder to enumerate than integers.
3. last_login tracked for audit trails.
4. is_active allows soft-banning without data loss.
"""

import uuid
from datetime import datetime, timezone
from ..extensions import db, bcrypt


class User(db.Model):
    """User account in the PhishGuard platform."""

    __tablename__ = 'users'

    # ==================================================
    # Columns
    # ==================================================

    # UUID primary key — not auto-incrementing integer.
    # WHY? Integers are predictable: if your ID is 42, there are probably
    # users 1-41. An attacker can enumerate users via IDOR vulnerabilities.
    # UUIDs are random 128-bit values — not guessable.
    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Email must be unique and indexed — we look up users by email on login
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )

    username = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )

    # NEVER store the raw password. Only the bcrypt hash.
    # The hash is 60 characters for bcrypt output.
    # String(128) gives room for future hash algorithm changes.
    password_hash = db.Column(db.String(128), nullable=False)

    # Role-based access control.
    # 'user' = standard analyst. 'admin' = platform administrator.
    # In a larger system, you'd use a separate roles table.
    role = db.Column(
        db.String(20),
        nullable=False,
        default='user'
    )

    # Soft delete / ban mechanism.
    # is_active=False blocks login without losing scan history.
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps — always use UTC internally, convert in the frontend.
    # Naive datetimes (without timezone) are a common bug source.
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    # Scan counter — denormalized for fast dashboard queries.
    # Instead of COUNT(*) on scans table every time, we increment this.
    scan_count = db.Column(db.Integer, default=0, nullable=False)

    # ==================================================
    # Relationships
    # ==================================================

    # backref='user' means scan.user gives you the User object
    # lazy='dynamic' means scans aren't loaded until .scans.all() is called
    # cascade='all, delete-orphan' means deleting a user deletes their scans
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

    # ==================================================
    # Password Methods
    # ==================================================

    def set_password(self, raw_password: str) -> None:
        """
        Hash a raw password and store the hash.

        NEVER call this with an already-hashed password.
        bcrypt.generate_password_hash() automatically:
        - Generates a random 16-byte salt
        - Combines salt + password
        - Runs the bcrypt algorithm with cost factor 12
        - Returns a 60-character string containing the hash AND the salt

        The salt is embedded in the hash string, so you don't need to
        store it separately. bcrypt.check_password_hash() extracts it
        automatically during verification.
        """
        self.password_hash = bcrypt.generate_password_hash(
            raw_password,
            rounds=12  # 2^12 = 4096 iterations. ~250ms per hash on modern hardware.
        ).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        """
        Verify a raw password against the stored hash.

        This is a CONSTANT-TIME comparison — it takes the same amount
        of time whether the password is correct or not. This prevents
        timing attacks where an attacker measures response time to guess
        which characters of the password are correct.
        """
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def update_last_login(self) -> None:
        """Record login timestamp and persist to DB."""
        self.last_login = datetime.now(timezone.utc)
        db.session.commit()

    # ==================================================
    # Serialization
    # ==================================================

    def to_dict(self, include_private: bool = False) -> dict:
        """
        Convert User to a JSON-serializable dictionary.

        NEVER include password_hash in the output.
        include_private adds fields only admins should see (email, scan_count).
        """
        data = {
            'id':         self.id,
            'username':   self.username,
            'role':       self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active':  self.is_active,
            'scan_count': self.scan_count,
        }
        if include_private:
            data['email'] = self.email
        return data

    def __repr__(self) -> str:
        return f'<User {self.username} ({self.role})>'