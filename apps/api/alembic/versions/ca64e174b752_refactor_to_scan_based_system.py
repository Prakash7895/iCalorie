"""refactor_to_scan_based_system

Revision ID: ca64e174b752
Revises: 8b13aa780629
Create Date: 2026-02-17 16:26:04.771369

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ca64e174b752"
down_revision: Union[str, None] = "8b13aa780629"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table changes
    op.alter_column("users", "ai_tokens", new_column_name="scans_remaining")
    op.drop_column("users", "total_purchased_tokens")
    op.drop_column("users", "free_scan_count")

    # Purchase receipts table changes
    op.alter_column("purchase_receipts", "tokens_added", new_column_name="scans_added")


def downgrade() -> None:
    # Purchase receipts table roll back
    op.alter_column("purchase_receipts", "scans_added", new_column_name="tokens_added")

    # Users table roll back
    op.add_column(
        "users",
        sa.Column("free_scan_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column(
            "total_purchased_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.alter_column("users", "scans_remaining", new_column_name="ai_tokens")
