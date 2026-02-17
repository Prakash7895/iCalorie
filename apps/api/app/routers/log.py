from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.schemas import LogRequest
from app.db import get_db
from app.models import MealLog, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/log", tags=["log"])


@router.post("")
async def create_log(
    payload: LogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created_at = None
    if payload.created_at:
        try:
            created_at = datetime.fromisoformat(
                payload.created_at.replace("Z", "+00:00")
            )
        except ValueError:
            created_at = None

    log = MealLog(
        user_id=current_user.id,
        created_at=created_at or datetime.utcnow(),
        total_calories=payload.total_calories,
        photo_url=payload.photo_url,
        items=[item.model_dump() for item in payload.items],
        plate_size_cm=payload.plate_size_cm,
    )
    db.add(log)
    db.commit()
    return {"status": "ok", "id": log.id}


@router.get("")
async def get_log(
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Filter by current user
    query = (
        db.query(MealLog)
        .filter(MealLog.user_id == current_user.id)
        .order_by(MealLog.created_at.desc())
    )

    if date:
        day = date[:10]
        start = datetime.fromisoformat(day)
        end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(MealLog.created_at >= start, MealLog.created_at <= end)

    results = []
    for row in query.all():
        results.append(
            {
                "id": row.id,
                "items": row.items or [],
                "total_calories": row.total_calories,
                "photo_url": row.photo_url,
                "plate_size_cm": row.plate_size_cm,
                "created_at": row.created_at.isoformat(),
            }
        )
    return {"items": results}


@router.get("/summary")
async def get_log_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get daily calorie totals for the last 7 days."""
    from datetime import timedelta
    import sqlalchemy as sa

    # Calculate date range
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Account age in days
    account_age_days = (now - current_user.created_at).days

    if account_age_days >= 6:
        # Established user: Show trailing 7 days ending today
        start_date = today_start - timedelta(days=6)
    else:
        # New user: Show first 7 days starting from their registration date
        start_date = current_user.created_at.replace(
            hour=0, minute=0, second=0, microsecond=0
        )

    # Query daily totals
    summary_query = (
        db.query(
            sa.func.date(MealLog.created_at).label("date"),
            sa.func.sum(MealLog.total_calories).label("total_calories"),
        )
        .filter(
            MealLog.user_id == current_user.id,
            # Query the range we actually care about
            MealLog.created_at >= start_date,
            MealLog.created_at < (start_date + timedelta(days=7)),
        )
        .group_by(sa.func.date(MealLog.created_at))
    )

    rows = summary_query.all()
    summary_dict = {
        (
            row.date.isoformat() if hasattr(row.date, "isoformat") else str(row.date)
        ): row.total_calories
        for row in rows
    }

    final_summary = []
    for i in range(7):
        current_date_obj = (start_date + timedelta(days=i)).date()
        date_str = current_date_obj.isoformat()
        final_summary.append(
            {
                "date": date_str,
                "total_calories": float(summary_dict.get(date_str, 0) or 0),
            }
        )

    return {"summary": final_summary}


@router.get("/{log_id}")
async def get_meal_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = (
        db.query(MealLog)
        .filter(MealLog.id == log_id, MealLog.user_id == current_user.id)
        .first()
    )
    if not log:
        return {"error": "Log not found"}, 404
    return {
        "id": log.id,
        "items": log.items or [],
        "total_calories": log.total_calories,
        "photo_url": log.photo_url,
        "plate_size_cm": log.plate_size_cm,
        "created_at": log.created_at.isoformat(),
    }


@router.delete("/{log_id}")
async def delete_meal_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = (
        db.query(MealLog)
        .filter(MealLog.id == log_id, MealLog.user_id == current_user.id)
        .first()
    )
    if not log:
        return {"error": "Log not found"}, 404

    db.delete(log)
    db.commit()
    return {"status": "ok"}
