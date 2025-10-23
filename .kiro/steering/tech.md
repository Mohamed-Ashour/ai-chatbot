# Technology Stack

## Backend Technologies

### Server (FastAPI)
- **FastAPI 0.115.0**: Modern Python web framework with automatic OpenAPI docs
- **Uvicorn**: ASGI server with hot reload support
- **WebSockets 13.1**: Real-time bidirectional communication
- **Redis 5.2.0**: In-memory data store for sessions and message streaming
- **Pydantic 2.10.1**: Data validation and serialization
- **Python-multipart**: Form data handling for token generation

### Worker (AI Processing)
- **Groq 0.32.0**: AI model integration for GPT responses
- **Redis Streams**: Async message queue processing
- **Python-dotenv**: Environment variable management
- **Asyncio**: Asynchronous programming for performance

## Frontend Technologies

### Client (Next.js)
- **Next.js 15.5.4**: React framework with App Router and Turbopack
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling with custom animations
- **Framer Motion 12.23.21**: Smooth animations and transitions

### UI Libraries
- **React Hot Toast**: Beautiful notification system
- **React Markdown 10.1.0**: Markdown rendering with GFM support
- **Rehype Highlight**: Syntax highlighting for code blocks
- **Lucide React**: Modern icon library

## Build System & Tools

### Development Commands
```bash
# Docker (Recommended)
./docker-start.sh              # Start all services
./docker-start.sh dev          # Development mode with hot reload
./docker-start.sh status       # Check service status
./docker-start.sh logs         # View service logs
./docker-start.sh clean        # Clean up containers and volumes

# Local Development
cd server && ./start_server.sh # Start FastAPI server
cd worker && python main.py    # Start AI worker
cd client && ./start_client.sh # Start Next.js client
```

### Testing Commands
```bash
# Client Testing
cd client
npm test                       # Run Jest tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report

# Server Testing
cd server
python -m pytest             # Run Python tests

# Worker Testing
cd worker
python -m pytest             # Run Python tests
```

### Build Commands
```bash
# Client Build
cd client
npm run build                 # Production build with Turbopack
npm run lint                  # ESLint checking

# Docker Build
docker compose build          # Build all services
docker compose up -d --build  # Build and start
```

## Configuration

### Environment Files
- `.env`: Root environment variables (Redis, API keys)
- `server/.env`: Server-specific config
- `worker/.env`: Worker-specific config (Groq API key)
- `client/.env.local`: Client-specific config (API URLs)

### Key Configuration
- **Session Duration**: 1 hour (configurable via TOKEN_EXPIRY_HOURS)
- **Chat Context**: Last 10 messages sent to AI
- **Auto-Reconnect**: 3-second delay with exponential backoff
- **CORS**: Configured for development and production origins