"""
Pydantic models for conversation and message data
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class Message(BaseModel):
    """Single message in a conversation"""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_index: int = Field(..., description="Sequential index in conversation")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MessageCreate(BaseModel):
    """Request to create a new message"""
    role: str
    content: str
    session_id: str


class ConversationSession(BaseModel):
    """Conversation session metadata"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User who owns this conversation")
    title: str = Field(default="New Conversation", description="Conversation title")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    message_count: int = Field(default=0)
    is_active: bool = Field(default=True)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ConversationCreate(BaseModel):
    """Request to create a new conversation session"""
    title: Optional[str] = "New Conversation"


class ConversationResponse(BaseModel):
    """Response containing conversation details"""
    session_id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    is_active: bool
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ConversationWithMessages(BaseModel):
    """Conversation session with all messages"""
    session: ConversationResponse
    messages: List[Message] = []
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatRequest(BaseModel):
    """Chat request with optional session"""
    query: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response with session info"""
    answer: str
    session_id: str
    message_index: int
