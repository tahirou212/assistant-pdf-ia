from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuizCreate(BaseModel):
    nb_questions: int = 5
    difficulty: str = "medium"

class QuizSubmit(BaseModel):
    quiz_id: int
    answers: List[int]
