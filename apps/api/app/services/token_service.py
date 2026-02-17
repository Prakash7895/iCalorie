"""Scan management service for AI usage tracking."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User
from app.config import settings


def add_purchased_scans(user: User, scans: int, db: Session) -> User:
    """
    Add purchased scans to user's balance.

    Args:
        user: The user to add scans to
        scans: Number of scans to add
        db: Database session

    Returns:
        Updated user object
    """
    user.scans_remaining += scans
    db.commit()
    db.refresh(user)
    return user


def get_scan_balance(user: User) -> dict:
    """
    Get user's current scan balance.

    Args:
        user: The user to get balance for

    Returns:
        Dictionary with scans_remaining
    """
    return {
        "scans_remaining": user.scans_remaining,
    }
