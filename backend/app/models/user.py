from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    username      = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(String, default="user")
    is_active     = Column(Boolean, default=True)
    tokens_used   = Column(Integer, default=0)
    created_at    = Column(DateTime, default=datetime.utcnow)

    documents     = relationship("Document",     back_populates="owner",  cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner",  cascade="all, delete-orphan")
    quizzes       = relationship("Quiz",         back_populates="owner",  cascade="all, delete-orphan")
    analytics     = relationship("Analytics",    back_populates="user",   cascade="all, delete-orphan")
