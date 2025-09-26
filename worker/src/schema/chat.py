from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import uuid

class SourceEnum(str, Enum):
    user = "user"
    assistant = "assistant"

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    msg: str
    timestamp: str = Field(default_factory=lambda: str(datetime.now()))
    source: SourceEnum
