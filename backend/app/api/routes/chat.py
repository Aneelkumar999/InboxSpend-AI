from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Any
import uuid

from app.db.database import get_db
from app.db.models import User, ChatSession, ChatMessage
from app.api.dependencies import get_current_user
from app.schemas.chat import ChatSessionResponse, ChatSessionCreate, MessageResponse, MessageCreate
from app.services.chat_service import AIChatEngine

router = APIRouter()

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    title = getattr(session_data, 'title', "New Chat") or "New Chat"
    session = ChatSession(user_id=current_user.id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

@router.post("/sessions/{session_id}/message")
def send_message(
    session_id: uuid.UUID,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_msg = ChatMessage(session_id=session_id, role="user", content=message.content)
    db.add(user_msg)
    db.commit()
    
    # Exclude the newly added user msg from the history passed to Gemini, it will append it internally
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id, 
        ChatMessage.id != user_msg.id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    engine = AIChatEngine()
    
    def event_stream():
        try:
            intent = engine.detect_intent(message.content)
            db_results = None
            
            if intent == "DATA_QUERY":
                sql = engine.generate_sql(message.content)
                try:
                    db_results = engine.execute_sql(db, sql, str(current_user.id))
                except Exception as e:
                    yield f"Error querying database: {e}"
                    return
                    
            full_response = ""
            for chunk in engine.stream_response(message.content, history, db_results):
                full_response += chunk
                yield chunk
                
            assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=full_response)
            db.add(assistant_msg)
            db.commit()
            
        except Exception as e:
            yield f"Error: {e}"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")
