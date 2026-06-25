import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentList
from app.services.pdf_service import save_upload_file, extract_text_from_pdf, detect_pdf_type
from app.services.rag_service import create_faiss_index
from app.services.analytics_service import log_action

router = APIRouter()

def process_document_bg(file_path: str, document_id: int, db_url: str):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    engine = create_engine(db_url, connect_args=connect_args)
    db = sessionmaker(bind=engine)()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return
        text, nb_pages        = extract_text_from_pdf(file_path)
        pdf_type              = detect_pdf_type(file_path)
        index_path, nb_chunks = create_faiss_index(text, document_id)
        doc.nb_pages          = nb_pages
        doc.nb_chunks         = nb_chunks
        doc.file_type         = pdf_type
        doc.faiss_index_path  = index_path
        doc.status            = "ready"
        db.commit()
    except Exception:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Fichier trop volumineux (max {settings.MAX_FILE_SIZE_MB}MB)")
    if db.query(Document).filter(Document.user_id == current_user.id).count() >= settings.MAX_DOCUMENTS_PER_USER:
        raise HTTPException(status_code=400, detail="Quota de documents atteint")
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path   = save_upload_file(content, unique_name, current_user.id)
    doc = Document(
        user_id=current_user.id, filename=unique_name,
        original_filename=file.filename, file_path=file_path,
        file_size=len(content), status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    background_tasks.add_task(process_document_bg, file_path, doc.id, settings.DATABASE_URL)
    log_action(db, current_user.id, "upload", {"filename": file.filename})
    return doc

@router.get("/", response_model=DocumentList)
def list_docs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return {"documents": docs, "total": len(docs)}

@router.get("/{document_id}", response_model=DocumentResponse)
def get_doc(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return doc

@router.delete("/{document_id}", status_code=204)
def delete_doc(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()

@router.get("/{document_id}/mindmap")
def get_mindmap(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document en cours de traitement")
    text, _ = extract_text_from_pdf(doc.file_path)
    from app.services.openai_service import generate_mindmap
    mindmap = generate_mindmap(text)
    log_action(db, current_user.id, "mindmap", {"document_id": document_id})
    return {"document_id": document_id, "mindmap": mindmap}
