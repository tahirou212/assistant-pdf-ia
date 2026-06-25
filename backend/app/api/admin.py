import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/users", response_model=list[UserResponse])
def all_users(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(User).all()

@router.put("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}

@router.put("/users/{user_id}/role")
def change_role(user_id: int, role: str, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Rôle invalide (user ou admin)")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.role = role
    db.commit()
    return {"user_id": user_id, "role": role}

@router.get("/stats")
def global_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    total_users  = db.query(User).count()
    total_docs   = db.query(Document).count()
    total_convs  = db.query(Conversation).count()
    total_tokens = sum(t[0] for t in db.query(User.tokens_used).all())
    return {
        "total_users":        total_users,
        "total_documents":    total_docs,
        "total_conversations": total_convs,
        "total_tokens_used":  total_tokens,
        "estimated_cost_usd": round(total_tokens * 0.000002, 4)
    }

@router.get("/documents")
def all_documents(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for doc in docs:
        user = db.query(User).filter(User.id == doc.user_id).first()
        result.append({
            "id":            doc.id,
            "filename":      doc.original_filename,
            "user":          user.username  if user else "?",
            "user_email":    user.email     if user else "?",
            "nb_pages":      doc.nb_pages,
            "nb_chunks":     doc.nb_chunks,
            "file_size":     doc.file_size,
            "status":        doc.status,
            "file_type":     doc.file_type,
            "uploaded_at":   doc.uploaded_at
        })
    return result

@router.delete("/documents/{document_id}")
def admin_delete_doc(document_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "Document supprimé"}

@router.get("/conversations")
def all_conversations(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    convs = db.query(Conversation).order_by(Conversation.created_at.desc()).all()
    result = []
    for conv in convs:
        user = db.query(User).filter(User.id == conv.user_id).first()
        doc  = db.query(Document).filter(Document.id == conv.document_id).first()
        nb   = db.query(Message).filter(Message.conversation_id == conv.id).count()
        result.append({
            "id":          conv.id,
            "title":       conv.title,
            "user":        user.username        if user else "?",
            "user_email":  user.email           if user else "?",
            "document":    doc.original_filename if doc  else "?",
            "nb_messages": nb,
            "created_at":  conv.created_at
        })
    return result

@router.get("/conversations/{conv_id}/messages")
def conv_messages_admin(conv_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    msgs = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at).all()
    return [{"id": m.id, "role": m.role, "content": m.content,
             "page_source": m.page_source, "created_at": m.created_at} for m in msgs]
