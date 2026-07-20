from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(BaseModel):
    content: str

class MessageResponse(MessageBase):
    id: UUID
    session_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatSessionBase(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionCreate(BaseModel):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
