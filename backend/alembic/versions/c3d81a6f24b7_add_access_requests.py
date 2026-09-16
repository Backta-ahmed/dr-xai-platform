"""Add access_requests

Clinician access is credential-gated: the platform is restricted to qualified
ophthalmologists, so there is no self-service sign-up. An applicant submits
their details with proof of qualification, and an administrator records a
verification decision here before creating the account through the existing
Manage Doctors path.

`documents` holds storage-key descriptors, never the files themselves and never
a public URL — the bytes are served only to administrators through the
authenticated document route.

Revision ID: c3d81a6f24b7
Revises: b2f7c4a91e30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d81a6f24b7"
down_revision: Union[str, Sequence[str], None] = "b2f7c4a91e30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "access_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("license_number", sa.String(length=100), nullable=False),
        sa.Column("institution", sa.String(length=200), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("documents", sa.JSON(), nullable=False),
        sa.Column(
            "status",
            # native_enum=False matches the model: a VARCHAR with a CHECK
            # constraint, which both SQLite and Postgres handle identically.
            sa.Enum(
                "pending", "approved", "rejected",
                name="accessrequeststatus",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.String(length=36), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_access_requests_email", "access_requests", ["email"])
    op.create_index("ix_access_requests_status", "access_requests", ["status"])
    op.create_index("ix_access_requests_created_at", "access_requests", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_access_requests_created_at", table_name="access_requests")
    op.drop_index("ix_access_requests_status", table_name="access_requests")
    op.drop_index("ix_access_requests_email", table_name="access_requests")
    op.drop_table("access_requests")
