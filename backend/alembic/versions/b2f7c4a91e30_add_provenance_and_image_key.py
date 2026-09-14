"""Add result provenance and replace image_url with an opaque image_key

Two changes to `diagnoses`:

1. Provenance columns. Until a real grading model is connected, every result
   comes from the stub backend. `is_simulated` records that per row, so once a
   real model lands the simulated history stays permanently distinguishable
   rather than blending in with genuine predictions.

2. `image_url` -> `image_key`. Images used to be stored with a public Supabase
   URL, which made patient scans readable by anyone holding the link. They are
   now stored under an opaque key and served only through the authenticated
   /api/v1/images/{id} route.

Existing rows are backfilled as simulated, which is accurate: every diagnosis
recorded before this migration came from `random.randint`.

Revision ID: b2f7c4a91e30
Revises: aef9b3928dd9
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2f7c4a91e30"
down_revision: Union[str, Sequence[str], None] = "aef9b3928dd9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # batch_alter_table so this also works on SQLite, which cannot ALTER or
    # rename columns in place.
    with op.batch_alter_table("diagnoses") as batch_op:
        batch_op.add_column(
            sa.Column(
                "is_simulated",
                sa.Boolean(),
                nullable=False,
                # Retained deliberately: it fails safe. A row inserted without
                # an explicit value is treated as simulated, which shows the
                # warning banner rather than silently presenting placeholder
                # output as a real diagnosis.
                server_default=sa.true(),
            )
        )
        batch_op.add_column(sa.Column("model_name", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("model_version", sa.String(length=50), nullable=True))
        batch_op.alter_column("image_url", new_column_name="image_key")

    # Attribute pre-existing rows to the stub that actually produced them.
    op.execute(
        "UPDATE diagnoses "
        "SET model_name = 'stub', model_version = '0.0.0-simulated' "
        "WHERE model_name IS NULL"
    )


def downgrade() -> None:
    with op.batch_alter_table("diagnoses") as batch_op:
        batch_op.alter_column("image_key", new_column_name="image_url")
        batch_op.drop_column("model_version")
        batch_op.drop_column("model_name")
        batch_op.drop_column("is_simulated")
