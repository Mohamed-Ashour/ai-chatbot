# Product Overview

## Full-Stack AI Chatbot

A modern, production-ready AI chatbot application featuring real-time messaging, session persistence, and AI-powered responses. The system provides a complete chat experience with automatic session restoration and intelligent conversation context.

## Core Features

- **Real-time AI Chat**: WebSocket-based bidirectional communication with GPT-powered responses
- **Session Persistence**: Chat history survives browser refresh with 1-hour token expiry
- **Auto-Reconnection**: Seamless reconnection handling for network interruptions
- **Rich UI**: Modern glassmorphism design with markdown support and syntax highlighting
- **Context Awareness**: AI maintains conversation context using chat history (last 10 messages)

## Architecture

Microservices architecture with three main components:
- **Server**: FastAPI backend with WebSocket support and Redis integration
- **Worker**: Async AI processing service that consumes Redis streams
- **Client**: Next.js frontend with TypeScript and Tailwind CSS

## Data Flow

1. Client sends message via WebSocket → Server
2. Server publishes to Redis stream → Worker
3. Worker processes with AI model → publishes response → Server
4. Server sends AI response → Client
5. Worker stores both messages in Redis for chat history