"""add_token_usage_table

Revision ID: fed1ca0f1085
Revises: 926b61cc137e
Create Date: 2026-02-16 10:54:04.651389

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fed1ca0f1085"
down_revision: Union[str, None] = "926b61cc137e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create token_usage table to track OpenAI API consumption."""
    op.create_table(
        "token_usage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_cost_usd", sa.Float(), nullable=True),
        sa.Column("endpoint", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_token_usage_id"), "token_usage", ["id"], unique=False)
    op.create_index(
        op.f("ix_token_usage_created_at"), "token_usage", ["created_at"], unique=False
    )


def downgrade() -> None:
    """Drop token_usage table."""
    op.drop_index(op.f("ix_token_usage_created_at"), table_name="token_usage")
    op.drop_index(op.f("ix_token_usage_id"), table_name="token_usage")
    op.drop_table("token_usage")
