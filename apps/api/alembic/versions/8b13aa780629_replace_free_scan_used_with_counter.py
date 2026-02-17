"""replace_free_scan_used_with_counter

Revision ID: 8b13aa780629
Revises: 9605cc5bf89e
Create Date: 2026-02-17 16:11:13.688638

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b13aa780629"
down_revision: Union[str, None] = "9605cc5bf89e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old boolean column
    op.drop_column("users", "free_scan_used")

    # Add the new integer column
    op.add_column(
        "users",
        sa.Column("free_scan_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    # Remove the new column
    op.drop_column("users", "free_scan_count")

    # Restore the old boolean column
    op.add_column(
        "users",
        sa.Column(
            "free_scan_used", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
