import re
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, decode_token
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatMessage, ConversationResponse, MessageResponse
from app.services.rag_service import search_similar_chunks
from app.services.openai_service import generate_answer, stream_answer
from app.services.analytics_service import log_action

router = APIRouter()

@router.post("/{document_id}/conversations", response_model=ConversationResponse, status_code=201)
def create_conv(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    conv = Conversation(user_id=current_user.id, document_id=document_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/{document_id}/conversations", response_model=list[ConversationResponse])
def list_convs(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Conversation).filter(
        Conversation.document_id == document_id,
        Conversation.user_id == current_user.id
    ).order_by(Conversation.created_at.desc()).all()

@router.get("/conversations/{conv_id}/messages", response_model=list[MessageResponse])
def get_messages(conv_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conv_id, Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    return db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at).all()

@router.post("/{document_id}/ask", response_model=MessageResponse)
def ask(document_id: int, data: ChatMessage, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document en cours de traitement")
    conv = None
    if data.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == data.conversation_id, Conversation.user_id == current_user.id
        ).first()
    if not conv:
        conv = Conversation(user_id=current_user.id, document_id=document_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    history = [{"role": m.role, "content": m.content}
               for m in db.query(Message).filter(Message.conversation_id == conv.id)
               .order_by(Message.created_at).all()[-6:]]
    chunks = search_similar_chunks(data.question, doc.faiss_index_path)
    answer, page_source, tokens_used = generate_answer(data.question, chunks, history)
    db.add(Message(conversation_id=conv.id, role="user", content=data.question))
    assistant_msg = Message(
        conversation_id=conv.id, role="assistant",
        content=answer, page_source=page_source, tokens_used=tokens_used
    )
    db.add(assistant_msg)
    current_user.tokens_used += tokens_used
    db.commit()
    db.refresh(assistant_msg)
    log_action(db, current_user.id, "chat", {"document_id": document_id})
    return assistant_msg

@router.websocket("/{document_id}/stream")
async def stream_ws(websocket: WebSocket, document_id: int, token: str, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        payload = decode_token(token)
        user = db.query(User).filter(User.email == payload.get("sub")).first()
        if not user:
            await websocket.send_text(json.dumps({"error": "Non authentifié"}))
            return
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user.id).first()
        if not doc or doc.status != "ready":
            await websocket.send_text(json.dumps({"error": "Document non disponible"}))
            return
        while True:
            data        = json.loads(await websocket.receive_text())
            question    = data.get("question", "")
            conv_id_req = data.get("conversation_id")
            if not question:
                continue
            # Get or create conversation
            conv = None
            if conv_id_req:
                conv = db.query(Conversation).filter(
                    Conversation.id == conv_id_req, Conversation.user_id == user.id
                ).first()
            if not conv:
                conv = Conversation(user_id=user.id, document_id=document_id)
                db.add(conv)
                db.commit()
                db.refresh(conv)
            # Notify frontend of conversation id
            await websocket.send_text(json.dumps({"type": "conversation_id", "conversation_id": conv.id}))
            # History
            history = [{"role": m.role, "content": m.content}
                       for m in db.query(Message).filter(Message.conversation_id == conv.id)
                       .order_by(Message.created_at).all()[-6:]]
            # Search
            chunks = search_similar_chunks(question, doc.faiss_index_path)
            page_source = None
            for chunk in chunks:
                match = re.search(r"\[PAGE (\d+)\]", chunk)
                if match:
                    page_source = f"Page {match.group(1)}"
                    break
            # Stream
            full_response = ""
            for token_text in stream_answer(question, chunks, history):
                full_response += token_text
                await websocket.send_text(json.dumps({"type": "token", "content": token_text}))
            # Save to DB
            db.add(Message(conversation_id=conv.id, role="user", content=question))
            asst_msg = Message(
                conversation_id=conv.id, role="assistant",
                content=full_response, page_source=page_source, tokens_used=len(full_response.split())
            )
            db.add(asst_msg)
            user.tokens_used += len(full_response.split())
            db.commit()
            db.refresh(asst_msg)
            await websocket.send_text(json.dumps({
                "type":            "done",
                "content":         full_response,
                "page_source":     page_source,
                "message_id":      asst_msg.id,
                "conversation_id": conv.id
            }))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"error": str(e)}))
        except Exception:
            pass
