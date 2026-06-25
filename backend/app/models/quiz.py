from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id           = Column(Integer, primary_key=True, index=True)
    document_id  = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    questions    = Column(Text, nullable=False)
    score        = Column(Float, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="quizzes")
    owner    = relationship("User",     back_populates="quizzes")
