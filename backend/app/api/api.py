from fastapi import APIRouter
from app.api.routes import auth, expenses

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
