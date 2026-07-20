import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "InboxSpend AI"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://inboxspend:postgres@localhost:5432/inboxspend_db"
    
    # JWT Auth
    SECRET_KEY: str = "dev-secret-key-replace-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # AI 
    GEMINI_API_KEY: str = ""
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
