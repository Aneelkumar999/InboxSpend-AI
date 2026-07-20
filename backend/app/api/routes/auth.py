from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from app.db.database import get_db
from app.db.models import User
from app.core.config import settings
from app.core import security
from app.services.auth_service import verify_google_access_token
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleAuthRequest(BaseModel):
    access_token: str

@router.post("/google/login", response_model=Token)
def login_google(
    request: GoogleAuthRequest, db: Session = Depends(get_db)
) -> Any:
    user_info = verify_google_access_token(request.access_token)
    
    email = user_info.get("email")
    google_id = user_info.get("sub")
    full_name = user_info.get("name")
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            google_id=google_id,
            full_name=full_name,
            picture=picture
        )
        db.add(user)
    
    user.access_token = request.access_token
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return current_user
