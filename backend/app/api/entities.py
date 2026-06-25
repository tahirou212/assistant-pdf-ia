from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.services.pdf_service import extract_text_from_pdf
from app.services.openai_service import extract_entities
from app.services.analytics_service import log_action

router = APIRouter()

@router.get("/{document_id}")
def get_entities(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document en cours de traitement")
    text, _ = extract_text_from_pdf(doc.file_path)
    entities = extract_entities(text)
    log_action(db, current_user.id, "entities", {"document_id": document_id})
    return {"document_id": document_id, "entities": entities}
