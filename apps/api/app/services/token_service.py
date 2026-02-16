"""Token management service for AI usage tracking."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User
from app.config import settings


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

    # Calculate hours until next midnight (reset time)
    tomorrow_midnight = (now + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    hours_until_reset = (tomorrow_midnight - now).total_seconds() / 3600

    return {
        "ai_tokens": user.ai_tokens,
    }
