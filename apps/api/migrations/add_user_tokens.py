"""
Database migration to add token tracking columns to users table.

This migration adds the following columns:
- ai_tokens: int (default 1) - Current available AI tokens
- last_token_reset: datetime - Last time daily tokens were reset
- total_purchased_tokens: int (default 0) - Lifetime purchased tokens for analytics

Run this script after updating the models.py file.
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/icalorie"
)


def upgrade():
    """Add token tracking columns to users table."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Add ai_tokens column
        conn.execute(
            text(
                """
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS ai_tokens INTEGER NOT NULL DEFAULT 1
        """
            )
        )

        # Add last_token_reset column
        conn.execute(
            text(
                """
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_token_reset TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        """
            )
        )

        # Add total_purchased_tokens column
        conn.execute(
            text(
                """
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS total_purchased_tokens INTEGER NOT NULL DEFAULT 0
        """
            )
        )

        conn.commit()
        print("✅ Migration completed successfully!")
        print("   - Added ai_tokens column (default: 1)")
        print("   - Added last_token_reset column (default: now)")
        print("   - Added total_purchased_tokens column (default: 0)")


def downgrade():
    """Remove token tracking columns from users table."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS ai_tokens"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS last_token_reset"))
        conn.execute(
            text("ALTER TABLE users DROP COLUMN IF EXISTS total_purchased_tokens")
        )
        conn.commit()
        print("✅ Migration rollback completed!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        print("Rolling back migration...")
        downgrade()
    else:
        print("Running migration...")
        upgrade()
