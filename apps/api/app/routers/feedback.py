from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, UserFeedback
from app.schemas import FeedbackRequest, FeedbackResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit user feedback or a feature suggestion."""
    feedback = UserFeedback(
        user_id=current_user.id,
        message=request.message.strip(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        message=feedback.message,
        created_at=feedback.created_at.isoformat(),
    )
