import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate, QuizSubmit
from app.services.pdf_service import extract_text_from_pdf
from app.services.openai_service import generate_quiz
from app.services.analytics_service import log_action

router = APIRouter()

@router.post("/{document_id}/generate")
def create_quiz(document_id: int, params: QuizCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document en cours de traitement")
    text, _ = extract_text_from_pdf(doc.file_path)
    questions = generate_quiz(text, params.nb_questions, params.difficulty)
    quiz = Quiz(document_id=document_id, user_id=current_user.id, questions=json.dumps(questions))
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    log_action(db, current_user.id, "quiz", {"document_id": document_id})
    return {"id": quiz.id, "questions": questions, "created_at": quiz.created_at}

@router.post("/submit")
def submit_quiz(data: QuizSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == data.quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz introuvable")
    questions = json.loads(quiz.questions)
    correct   = sum(1 for i, q in enumerate(questions) if i < len(data.answers) and data.answers[i] == q["correct_answer"])
    score     = (correct / len(questions)) * 100
    quiz.score = score
    quiz.completed_at = datetime.utcnow()
    db.commit()
    return {"quiz_id": quiz.id, "score": score, "correct": correct, "total": len(questions)}

@router.get("/{document_id}/history")
def quiz_history(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.document_id == document_id, Quiz.user_id == current_user.id).all()
    return [{"id": q.id, "score": q.score, "created_at": q.created_at} for q in quizzes]
