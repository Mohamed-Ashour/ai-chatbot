import uuid
from datetime import datetime
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class SourceEnum(str, Enum):
    user = "user"
    assistant = "assistant"


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    msg: str
    timestamp: str = Field(default_factory=lambda: str(datetime.now()))
    source: SourceEnum


class Chat(BaseModel):
    token: str
    messages: List[Message]
    name: str
    session_start: str = Field(default_factory=lambda: str(datetime.now()))
