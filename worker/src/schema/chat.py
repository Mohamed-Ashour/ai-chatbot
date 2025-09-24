from datetime import datetime
from enum import Enum
from pydantic import BaseModel
import uuid

class SourceEnum(str, Enum):
    user = "user"
    assistant = "assistant"

class Message(BaseModel):
    id: str = str(uuid.uuid4())
    msg: str
    timestamp: str = str(datetime.now())
    source: SourceEnum
