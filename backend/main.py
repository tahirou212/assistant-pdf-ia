from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import auth, documents, chat, quiz, summary, entities, analytics, admin
from app.core.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Assistant IA pour Analyse de Documents PDF",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Chat"])
app.include_router(quiz.router,      prefix="/api/quiz",      tags=["Quiz"])
app.include_router(summary.router,   prefix="/api/summary",   tags=["Summary"])
app.include_router(entities.router,  prefix="/api/entities",  tags=["Entities"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router,     prefix="/api/admin",     tags=["Admin"])

@app.get("/")
def root():
    return {"message": "Assistant PDF IA API", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
