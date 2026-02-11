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
                "items": row.items or [],
                "total_calories": row.total_calories,
                "photo_url": row.photo_url,
                "plate_size_cm": row.plate_size_cm,
                "created_at": row.created_at.isoformat(),
            }
        )
    return {"items": results}
