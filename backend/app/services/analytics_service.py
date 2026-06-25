import json
from sqlalchemy.orm import Session
from app.models.analytics import Analytics
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.quiz import Quiz

def log_action(db: Session, user_id: int, action: str, extra: dict = None):
    entry = Analytics(
        user_id=user_id,
        action=action,
        extra_data=json.dumps(extra) if extra else None
    )
    db.add(entry)
    db.commit()

def get_user_stats(db: Session, user_id: int) -> dict:
    from app.models.user import User
    total_docs  = db.query(Document).filter(Document.user_id == user_id).count()
    total_convs = db.query(Conversation).filter(Conversation.user_id == user_id).count()
    total_qs    = db.query(Message).join(Conversation).filter(
        Conversation.user_id == user_id, Message.role == "user"
    ).count()
    total_quiz  = db.query(Quiz).filter(Quiz.user_id == user_id).count()
    user        = db.query(User).filter(User.id == user_id).first()
    return {
        "total_documents":    total_docs,
        "total_conversations": total_convs,
        "total_questions":    total_qs,
        "total_quizzes":      total_quiz,
        "tokens_used":        user.tokens_used if user else 0
    }
