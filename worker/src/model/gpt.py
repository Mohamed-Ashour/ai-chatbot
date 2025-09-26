import os
from dotenv import load_dotenv
import asyncio
from groq import AsyncGroq
from typing import List
from src.schema.chat import Message


load_dotenv()

class GPT:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"),)

    async def query(self, messages: List[Message]) -> Message:
        
        print("Messages to send to GPT:", messages)
        
        def map_to_api_messages(message):
            return {"role": message.source, "content": message.msg}
        
        api_messages = list(map(map_to_api_messages, messages))
        
        print("API messages:", api_messages)
        
        chat_completion = await self.client.chat.completions.create(
            messages=api_messages,
            model="openai/gpt-oss-20b",
            stream=False,
            max_completion_tokens=512,
        )

        print("Full chat completion response:", chat_completion.model_dump())
        
        return Message(
            msg=chat_completion.choices[0].message.content,
            source="assistant"
        )
