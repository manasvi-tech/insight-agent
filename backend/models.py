from pydantic import BaseModel
from typing import Optional, List, Any

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    question: str

class SSEEvent(BaseModel):
    type: str
    content: Optional[str] = None
    tool: Optional[str] = None
    source: Optional[str] = None
    query: Optional[str] = None
    message: Optional[str] = None
    results: Optional[List[Any]] = None