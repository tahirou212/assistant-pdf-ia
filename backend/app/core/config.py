from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Assistant PDF IA"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./assistant_pdf.db"

    SECRET_KEY: str = "change-this-secret-key-in-production-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-3.5-turbo"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    REDIS_URL: str = "redis://localhost:6379"

    MAX_FILE_SIZE_MB: int = 20
    MAX_DOCUMENTS_PER_USER: int = 10
    UPLOAD_DIR: str = "uploads"
    FAISS_DIR: str = "faiss_indexes"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
