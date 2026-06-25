from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    action     = Column(String, nullable=False)
    extra_data = Column(Text, nullable=True)
    timestamp  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analytics")
