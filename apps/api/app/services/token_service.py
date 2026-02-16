"""Token management service for AI usage tracking."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User
from app.config import settings


def reset_daily_tokens_if_needed(user: User, db: Session) -> User:
    """
    Reset user's AI tokens to daily limit if 24 hours have passed since last reset.

    Args:
        user: The user to check and potentially reset
        db: Database session

    Returns:
        Updated user object
    """
    now = datetime.utcnow()
    hours_since_reset = (now - user.last_token_reset).total_seconds() / 3600

    if hours_since_reset >= settings.token_reset_hours:
        user.ai_tokens = settings.daily_free_tokens
        user.last_token_reset = now
        db.commit()
        db.refresh(user)

    return user


def check_and_deduct_token(user: User, db: Session) -> bool:
    """
    Check if user has tokens available and deduct one if they do.

    Args:
        user: The user to check
        db: Database session

    Returns:
        True if token was deducted, False if insufficient tokens
    """
    # First, reset tokens if needed
    user = reset_daily_tokens_if_needed(user, db)

    if user.ai_tokens <= 0:
        return False

    user.ai_tokens -= 1
    db.commit()
    db.refresh(user)
    return True


def add_purchased_tokens(user: User, amount: int, db: Session) -> User:
    """
    Add purchased tokens to user's balance.

    Args:
        user: The user to add tokens to
        amount: Number of tokens to add
        db: Database session

    Returns:
        Updated user object
    """
    user.ai_tokens += amount
    user.total_purchased_tokens += amount
    db.commit()
    db.refresh(user)
    return user


def get_token_balance(user: User) -> dict:
    """
    Get user's current token balance and reset information.

    Args:
        user: The user to get balance for

    Returns:
        Dictionary with token balance and reset info
    """
    now = datetime.utcnow()
    hours_since_reset = (now - user.last_token_reset).total_seconds() / 3600
    hours_until_reset = max(0, settings.token_reset_hours - hours_since_reset)

    return {
        "ai_tokens": user.ai_tokens,
        "last_token_reset": user.last_token_reset.isoformat(),
        "hours_until_reset": round(hours_until_reset, 2),
    }
