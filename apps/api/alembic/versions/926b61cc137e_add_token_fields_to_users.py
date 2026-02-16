"""add_token_fields_to_users

Revision ID: 926b61cc137e
Revises: 952dbde22740
Create Date: 2026-02-14 15:07:31.893115

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "926b61cc137e"
down_revision: Union[str, None] = "952dbde22740"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add token tracking columns to users table."""
    op.add_column(
        "users",
        sa.Column("ai_tokens", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "users",
        sa.Column(
            "last_token_reset",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "total_purchased_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
    )


def downgrade() -> None:
    """Remove token tracking columns from users table."""
    op.drop_column("users", "total_purchased_tokens")
    op.drop_column("users", "last_token_reset")
    op.drop_column("users", "ai_tokens")
