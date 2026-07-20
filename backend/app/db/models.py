import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    picture = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    message_id = Column(String, unique=True, index=True, nullable=False)
    merchant = Column(String, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    category = Column(String(50), nullable=True, default="Others", index=True)
    email_subject = Column(String)
    sender = Column(String)
    snippet = Column(String)
    
    currency = Column(String(10), nullable=True, default="USD")
    payment_method = Column(String(50), nullable=True)
    order_id = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    items = Column(JSONB, nullable=True)
    tax = Column(Numeric(10, 2), nullable=True)
    discount = Column(Numeric(10, 2), nullable=True)
    is_subscription = Column(Boolean, nullable=True, default=False)
    billing_cycle = Column(String(50), nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="expenses")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # 'user' or 'assistant'
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    session = relationship("ChatSession", back_populates="messages")

class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    frequency = Column(String(50), nullable=False) # 'monthly', 'yearly', 'weekly'
    email_to = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")
