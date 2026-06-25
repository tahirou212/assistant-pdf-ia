from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessage(BaseModel):
    question: str
    conversation_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    page_source: Optional[str] = None
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}

class ConversationResponse(BaseModel):
    id: int
    title: str
    document_id: int
    created_at: datetime
    messages: List[MessageResponse] = []

    model_config = {"from_attributes": True}
