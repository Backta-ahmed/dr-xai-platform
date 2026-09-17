"""Add laterality to diagnoses

A fundus photograph captures one eye, and the same DR grade carries different
clinical weight in a treated versus an untreated eye. Without laterality a
record cannot be compared against a prior scan of the same eye, which is the
basis of tracking progression — so the platform was storing incomplete records.

Nullable at the database layer while required by the API for new diagnoses:
rows imported from an external system may genuinely not carry laterality, and
representing that as "not recorded" is more honest than defaulting to one eye
and silently inventing a clinical fact.

Revision ID: d5e2b8c31f09
Revises: c3d81a6f24b7
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5e2b8c31f09"
down_revision: Union[str, Sequence[str], None] = "c3d81a6f24b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("diagnoses") as batch_op:
        batch_op.add_column(
            sa.Column(
                "eye",
                sa.Enum("od", "os", name="eyeenum", native_enum=False),
                nullable=True,
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("diagnoses") as batch_op:
        batch_op.drop_column("eye")
