"""add ai_task_id to scans

Revision ID: 0001_add_ai_task_id
Revises: 
Create Date: 2026-06-02 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_ai_task_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add ai_task_id column to scans table
    op.add_column('scans', sa.Column('ai_task_id', sa.String(length=100), nullable=True))


def downgrade():
    op.drop_column('scans', 'ai_task_id')
