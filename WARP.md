# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Docker Development (Recommended)
```bash
# Start all services (Redis, Server, Worker, Client)
./docker-start.sh

# Start in development mode with hot reload
./docker-start.sh dev

# Check service status and logs
./docker-start.sh status
./docker-start.sh logs

# Stop services
./docker-start.sh stop

# Clean up containers and rebuild
./docker-start.sh clean
```

### Local Development
```bash
# Server (Terminal 1)
cd server
./start_server.sh

# Worker (Terminal 2)
cd worker
python main.py

# Client (Terminal 3)
cd client
./start_client.sh
# OR for development mode:
npm run dev
```

### Testing & Building
```bash
# Test server functionality
cd server
python test_server.py

# Build and test client
cd client
npm run build
npm run lint
```

## Architecture Overview

This is a **microservices architecture** with three main components communicating via Redis streams:

### Data Flow Pattern
1. **Client** sends message via WebSocket → **Server**
2. **Server** publishes to Redis stream → **Worker**
3. **Worker** processes with AI model → publishes response → **Server**
4. **Server** sends AI response → **Client**
5. **Worker** stores both messages in Redis for chat history

### Core Components

#### `/server` - FastAPI API Server
- **Main entry**: `main.py` - FastAPI app with CORS configuration
- **Routes**: `src/routes/chat.py` - API endpoints (`/token`, `/chat_history`, WebSocket `/chat`)
- **WebSocket**: `src/socket/connection.py` - Connection management and token validation
- **Redis**: `src/redis/` - Stream producers, consumers, and cache management
- **Schema**: `src/schema/chat.py` - Pydantic data models

**Key patterns:**
- Token-based session management with 1-hour TTL
- WebSocket endpoint at `/chat?token=<token>`
- CORS configured for both development and production environments

#### `/worker` - AI Processing Worker
- **Main entry**: `main.py` - Worker process for consuming Redis streams
- **AI Model**: `src/model/gpt.py` - OpenAI/Groq API integration
- **Redis**: `src/redis/` - Stream consumption and message processing
- **Schema**: Shared data models with server

**Key patterns:**
- Consumes `message_channel` Redis stream
- Publishes responses to `response_channel_{token}` streams
- Uses last 10 messages for context in AI responses

#### `/client` - Next.js Frontend
- **Main entry**: `src/app/page.tsx` - Chat interface
- **Chat Logic**: `src/hooks/useChat.ts` - WebSocket connection and state management
- **Components**: `src/components/` - UI components (MessageList, MessageInput, etc.)
- **Session**: `src/lib/session.ts` - Session persistence and restoration

**Key patterns:**
- Custom `useChat` hook centralizes all chat functionality
- Session persistence via localStorage with automatic restoration
- WebSocket auto-reconnection with exponential backoff
- Token expiration handling with graceful user notification

## Configuration Patterns

### Environment Setup
- **Root**: Copy `.env-example` to `.env`, configure Redis password and Groq API key
- **Server**: Copy `server/.env.example` to `server/.env`, configure Redis credentials
- **Worker**: Copy `worker/.env.example` to `worker/.env`, add `GROQ_API_KEY`
- **Client**: Copy `client/.env.local.example` to `client/.env.local`, set API URLs

### Key Environment Variables
```bash
# Server
REDIS_HOST=redis              # Docker: 'redis', Local: 'localhost'
REDIS_PORT=6379
REDIS_USER=default            # Default Redis user
REDIS_PASSWORD=your_password  # Set in root .env file
APP_ENV=development           # Controls CORS behavior
CORS_ORIGINS=http://localhost:3000,http://client:3000

# Worker
GROQ_API_KEY=your_api_key
REDIS_HOST=redis              # Docker: 'redis', Local: 'localhost'
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_password

# Client (Build-time only - baked into JavaScript bundle)
NEXT_PUBLIC_API_URL=http://localhost:8000  # Docker and local both use 8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**IMPORTANT**: Client environment variables (`NEXT_PUBLIC_*`) are baked into the JavaScript bundle at **build-time**, not runtime.
- To change client URLs, you must rebuild the client image with `--build-arg`
- Runtime environment variables in docker-compose won't affect the client
- See `DEPLOYMENT.md` for production deployment with environment-specific builds

## Development Workflows

### Adding New API Endpoints
1. Add route handler in `server/src/routes/chat.py`
2. Register route in `server/main.py` with `api.include_router()`
3. Update CORS origins if needed for cross-origin requests

### Modifying AI Behavior
1. Edit `worker/src/model/gpt.py` for AI model logic
2. Adjust context management (currently uses last 10 messages)
3. Worker automatically picks up Redis stream messages

### Frontend Component Development
1. Add components in `client/src/components/`
2. Use `useChat` hook for accessing chat state and actions
3. Follow existing patterns for session and connection status handling

### Redis Stream Integration
- **Message flow**: `message_channel` → Worker → `response_channel_{token}`
- **Session storage**: Token-based cache with TTL
- **Connection patterns**: Producer/Consumer pattern for scalability

## Troubleshooting Common Issues

### Redis Configuration
- **Redis Stack**: The project uses `redis/redis-stack-server:7.4.0-v0` which includes RedisJSON module required for session storage
- **Authentication**: Redis is configured with password authentication (set via `REDIS_PASSWORD` in `.env`)
- **Connection**: Server and worker connect using individual environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`)

### Connection Issues
```bash
# Test Redis connectivity (with authentication)
docker compose exec redis redis-cli -a your_password ping

# Test server health
curl http://localhost:8000/health

# Check Docker service logs
docker compose logs [service-name]
```

### Session/Token Problems
- Check Redis TTL settings (default 1 hour)
- Verify token is included in WebSocket URL
- Use browser DevTools to inspect WebSocket connection status

### Worker Processing Issues
- **Known issue**: Worker may stop consuming after MacBook sleep - restart required
- Check `GROQ_API_KEY` environment variable
- Monitor Redis streams for message backlog

## Important Patterns to Follow

### WebSocket Communication
- All WebSocket messages require valid token in query parameter
- Server uses WebSocket close codes: 1008 for auth issues, 1000 for normal closure
- Client implements auto-reconnection with exponential backoff

### Session Management
- Sessions persist in both Redis (server-side) and localStorage (client-side)
- Token expiration triggers complete session cleanup
- Chat history loaded on session restoration

### Error Handling
- Token expiration: Graceful logout with user notification
- Connection errors: Auto-reconnection attempts with user feedback
- API errors: Toast notifications for user awareness

## Key Dependencies

### Server (FastAPI)
- `fastapi==0.115.0` - Web framework
- `redis[hiredis]==5.2.0` - Redis client with performance optimizations
- `websockets==13.1` - WebSocket support
- `uvicorn[standard]==0.32.0` - ASGI server

### Worker (Python)
- `groq==0.32.0` - AI model API client (updated from 0.14.0 to support max_completion_tokens)
- `redis[hiredis]==5.2.0` - Redis stream processing

### Client (Next.js)
- `next@15.5.4` - React framework with App Router
- `framer-motion` - Animations and transitions
- `react-markdown` - Markdown rendering with syntax highlighting
- `react-hot-toast` - User notifications