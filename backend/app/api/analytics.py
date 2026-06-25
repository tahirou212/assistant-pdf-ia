from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.analytics_service import get_user_stats

router = APIRouter()

@router.get("/me")
def my_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_stats(db, current_user.id)
