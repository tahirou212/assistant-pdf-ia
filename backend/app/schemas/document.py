from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    nb_pages: int
    nb_chunks: int
    file_size: int
    status: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}

class DocumentList(BaseModel):
    documents: List[DocumentResponse]
    total: int
