#!/usr/bin/env python3
"""
Cron job to reset all users' free_scan_used flag to False at midnight.

Run this script daily at 00:00 using cron:
    0 0 * * * /path/to/python /path/to/reset_daily_scans.py

Or use a scheduler like APScheduler in your main application.
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/icalorie"
)


def reset_all_users_daily_scans():
    """Replenish scans to MAX_FREE_SCANS if current balance is lower."""
    from app.config import settings

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        max_free = settings.max_free_scans

        # Replenish scans ONLY if current scans_remaining < max_free
        result = session.execute(
            text(
                "UPDATE users SET scans_remaining = :max_free WHERE scans_remaining < :max_free"
            ),
            {"max_free": max_free},
        )
        session.commit()

        affected_rows = result.rowcount
        timestamp = datetime.utcnow().isoformat()

        print(f"[{timestamp}] ✅ Daily scan replenishment completed.")
        print(f"   Replenished {affected_rows} users to {max_free} scans.")

        return affected_rows
    except Exception as e:
        session.rollback()
        print(f"❌ Error replenishing daily scans: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Running Daily Free Scan Reset Job")
    print("=" * 60)
    reset_all_users_daily_scans()
    print("=" * 60)
