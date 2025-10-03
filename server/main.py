from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from src.routes.chat import chat

load_dotenv()

api = FastAPI(
    title="AI Chatbot API",
    description="FastAPI server for AI chatbot with WebSocket support",
    version="1.0.0"
)

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api.include_router(chat)

@api.get("/test")
async def root():
    return {"msg": "API is Online"}

@api.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-chatbot-server"}

if __name__ == "__main__":
    if os.environ.get('APP_ENV') == "development":
        uvicorn.run("main:api", host="0.0.0.0", port=3500, reload=True)
    else:
        pass
