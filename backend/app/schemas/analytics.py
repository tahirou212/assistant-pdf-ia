from pydantic import BaseModel

class AnalyticsResponse(BaseModel):
    total_documents: int
    total_conversations: int
    total_questions: int
    total_quizzes: int
    tokens_used: int
