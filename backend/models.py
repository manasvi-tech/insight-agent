from pydantic import BaseModel
from typing import Optional, List, Any


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    question: str
    conversation_id: Optional[int] = None


class SSEEvent(BaseModel):
    type: str
    content: Optional[str] = None
    tool: Optional[str] = None
    source: Optional[str] = None
    query: Optional[str] = None
    message: Optional[str] = None
    results: Optional[List[Any]] = None


class ConversationCreate(BaseModel):
    question: str


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: str


class MessageResponse(BaseModel):
    role: str
    content: str