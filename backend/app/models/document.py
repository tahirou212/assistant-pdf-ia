from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename          = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path         = Column(String, nullable=False)
    file_type         = Column(String, default="native")
    nb_pages          = Column(Integer, default=0)
    nb_chunks         = Column(Integer, default=0)
    file_size         = Column(Integer, default=0)
    status            = Column(String, default="processing")
    faiss_index_path  = Column(String, nullable=True)
    uploaded_at       = Column(DateTime, default=datetime.utcnow)

    owner         = relationship("User",         back_populates="documents")
    conversations = relationship("Conversation", back_populates="document", cascade="all, delete-orphan")
    quizzes       = relationship("Quiz",         back_populates="document", cascade="all, delete-orphan")
