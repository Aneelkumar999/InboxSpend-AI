from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, expenses, chat, reports
from app.services.scheduler_service import scheduler_service
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler_service.start()
    yield
    scheduler_service.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://inbox-spend-ai.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(expenses.router, prefix=f"{settings.API_V1_STR}/expenses", tags=["expenses"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} Backend"}
