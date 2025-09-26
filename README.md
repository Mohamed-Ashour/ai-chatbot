# 🤖 Full-Stack AI Chatbot

A modern, production-ready AI chatbot application featuring real-time messaging, session persistence, and AI-powered responses. Built with FastAPI backend, Next.js frontend, and Redis-based message streaming architecture.

## 🏢️ Architecture

This is a **microservices architecture** with three main components:

```
fullstack-ai-chatbot/
├── server/                # FastAPI API Server
│   ├── main.py            # FastAPI app with CORS
│   ├── src/               # Source code
│   │   ├── routes/        # API routes (token, chat_history, websocket)
│   │   ├── redis/         # Redis integration (streams, cache)
│   │   ├── socket/        # WebSocket management & token validation
│   │   └── schema/        # Pydantic data models
│   ├── start_server.sh    # Server startup script
│   └── requirements.txt   # Python dependencies
│
├── worker/                # AI Processing Worker
│   ├── main.py            # Worker process for AI responses
│   ├── src/               # Source code
│   │   ├── model/         # AI model integration (GPT)
│   │   ├── redis/         # Redis streams & cache
│   │   └── schema/        # Shared data models
│   └── requirements.txt   # Python dependencies
│
└── generated-client/      # Next.js Frontend
    ├── src/               # Source code
    │   ├── app/           # Next.js app directory
    │   ├── components/    # React components
    │   ├── hooks/         # Custom React hooks (useChat)
    │   ├── lib/           # Utilities & session management
    │   └── types/         # TypeScript types
    ├── start_client.sh    # Client startup script
    └── package.json       # Node.js dependencies
```

### 📋 Data Flow
1. **Client** sends message via WebSocket → **Server**
2. **Server** publishes to Redis stream → **Worker** 
3. **Worker** processes with AI model → publishes response → **Server**
4. **Server** sends AI response → **Client**
5. **Worker** stores both messages in Redis for chat history

## ✨ Features

### 🚀 Core Functionality
- 🤖 **AI-Powered Responses** - Real AI model integration with GPT
- ⚡ **Real-time Messaging** - Instant WebSocket communication
- 💾 **Session Persistence** - Chat history survives browser refresh
- 🔄 **Auto-Reconnection** - Seamless reconnection on network issues
- 🔐 **Token-based Security** - Secure session management

### 🏢️ Backend (FastAPI Server)
- 🚀 **FastAPI** with automatic OpenAPI documentation
- 🔌 **WebSocket** support for bidirectional communication
- 📡 **Redis Streams** for message queuing and processing
- 📋 **Chat History API** - Persistent conversation storage
- 🔐 **Token Validation** - Secure WebSocket connections
- ⏰ **Session Expiry** - Automatic cleanup (1-hour TTL)
- 🌐 **CORS** configured for development and production

### 🛠️ Worker (AI Processor)
- 🤖 **GPT Integration** - OpenAI API for AI responses  
- 📡 **Redis Stream Consumer** - Processes messages asynchronously
- 📋 **History Management** - Stores user and AI messages
- 🔄 **Context Awareness** - Uses chat history for better responses
- ⚡ **Async Processing** - Non-blocking AI response generation

### 🎨 Frontend (Next.js Client)
- 💅 **Modern UI** - Glassmorphism design with Tailwind CSS
- 🎦 **Smooth Animations** - Framer Motion for delightful interactions
- 📱 **Responsive Design** - Works perfectly on all devices
- 📋 **Markdown Support** - Rich text rendering with syntax highlighting
- 📏 **Session Restoration** - Automatic login and history loading
- 🎭 **Loading States** - Professional loading screens and indicators
- 🔔 **Toast Notifications** - User feedback for all actions
- 🚫 **Token Expiration** - Graceful handling of expired sessions

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Redis** instance (local or cloud)
- **OpenAI API Key** (for AI responses)

### 1. Environment Setup

```bash
cd /Users/ashour/Code/Playground/fullstack-ai-chatbot

# Configure server environment
cd server
cp .env.example .env
# Edit .env with your Redis credentials

# Configure worker environment
cd ../worker  
cp .env.example .env
# Edit .env with your OpenAI API key

# Configure client environment
cd ../generated-client
cp .env.local.example .env.local
# Edit with your API URLs
```

### 2. Start the Server (Terminal 1)

```bash
cd server
./start_server.sh
```

✅ Server runs on `http://localhost:3500`:
- 🏠 Health: `GET /test`
- 🎫 Token: `POST /token`  
- 📋 History: `GET /chat_history`
- 🔌 WebSocket: `ws://localhost:3500/chat`
- 📖 Docs: `http://localhost:3500/docs`

### 3. Start the Worker (Terminal 2)

```bash
cd worker
python main.py
```

✅ Worker will consume Redis streams and process AI requests

### 4. Start the Client (Terminal 3)

```bash
cd generated-client
./start_client.sh
```

✅ Client runs on `http://localhost:3000`

### 5. Start Chatting! 💬

1. Open `http://localhost:3000`
2. Click "Get Started"
3. Enter your name
4. Chat with the AI - responses are powered by GPT!
5. Refresh page to test session persistence

## 🛠️ Configuration

### Server Configuration

Edit `server/.env`:
```env
APP_ENV=development
REDIS_URL=your_redis_host:port
REDIS_USER=your_redis_user
REDIS_PASSWORD=your_redis_password
```

### Worker Configuration  

Edit `worker/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=your_redis_host:port
REDIS_USER=your_redis_user
REDIS_PASSWORD=your_redis_password
```

### Client Configuration

Edit `generated-client/.env.local`:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3500
NEXT_PUBLIC_WS_URL=ws://localhost:3500
```

### Session Configuration
- **Session Duration**: 1 hour (configurable in server Redis TTL)
- **Chat History Limit**: Last 10 messages sent to AI for context
- **Auto-Reconnect**: 3-second delay with exponential backoff

## 🐞 Troubleshooting

### CORS Issues
- ✅ **Fixed**: CORS is now properly configured for development
- 🔧 The server allows all origins in development mode
- 🔒 Production mode has restrictive CORS settings

### Connection Issues
```bash
# Test server connection
curl http://localhost:3500/test

# Test token generation
curl -X POST -F "name=TestUser" http://localhost:3500/token
```

### Common Solutions
- **Server won't start**: Check Redis connection and credentials
- **Client can't connect**: Ensure server is running first
- **WebSocket errors**: Verify token is valid and not expired
- **Build errors**: Run `npm install` in client directory

## 🧪 Testing

### Test Server
```bash
cd server
source .venv/bin/activate
python test_server.py
```

### Test Client Build
```bash
cd generated-client
npm run build
```

## 📡 API Endpoints

### REST API
- `GET /test` - Health check endpoint
- `POST /token` - Generate chat token (form data: `name`)
- `GET /chat_history?token=<token>` - Retrieve chat history with messages

**Response Codes:**
- `200` - Success
- `400` - Invalid request or expired session
- `500` - Internal server error

### WebSocket
- `ws://localhost:3500/chat?token=<token>` - Real-time bidirectional chat

**Connection Codes:**
- `1000` - Normal closure
- `1008` - Policy violation (invalid/expired token)

## 🎨 UI Components

### Core Components
- **WelcomeModal** - User onboarding with name input
- **SessionRestoreLoader** - Loading screen during session restoration
- **MessageList** - Scrollable chat history with markdown support
- **Message** - Individual message bubble with user/AI styling
- **MessageInput** - Auto-resizing textarea with send button
- **ConnectionStatus** - Real-time connection indicator
- **TypingIndicator** - Animated dots when AI is responding

### Features
- **Markdown Rendering** - Code syntax highlighting, tables, lists
- **Session Persistence** - Automatic login and history restoration
- **Token Expiration** - Graceful session timeout handling
- **Toast Notifications** - User feedback for all actions

## 🔧 Development

### Server Development
```bash
cd server
source .venv/bin/activate
uvicorn main:api --reload --host 0.0.0.0 --port 3500
```

### Client Development
```bash
cd generated-client
npm run dev
```

## 📚 Technologies Used

### Backend (Server)
- **FastAPI** - Modern Python web framework with auto docs
- **Redis** - In-memory data store for sessions and streaming
- **WebSockets** - Real-time bidirectional communication
- **Pydantic** - Data validation with `Field(default_factory=...)`
- **Uvicorn** - High-performance ASGI web server

### AI Worker
- **OpenAI GPT** - AI model for intelligent responses
- **Redis Streams** - Message queue processing
- **Asyncio** - Asynchronous programming for performance
- **Context Management** - Chat history for better responses

### Frontend (Client)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom animations
- **Framer Motion** - Smooth animations and transitions
- **React Hot Toast** - Beautiful notification system
- **React Markdown** - Markdown rendering with syntax highlighting
- **Lucide React** - Modern icon library

## 🚀 Deployment

### Production Checklist

#### Server
```bash
# Production environment
export APP_ENV=production
export REDIS_URL=your_production_redis

# Use Gunicorn + Uvicorn for production
gunicorn main:api -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3500
```

#### Worker  
```bash
# Ensure OpenAI API key is set
export OPENAI_API_KEY=your_production_key

# Run worker with process manager (PM2, systemd, etc.)
python main.py
```

#### Client
```bash
# Build optimized bundle
npm run build

# Deploy to Vercel/Netlify/etc.
# Update API URLs for production
```

## 🔄 Recent Updates

- ✨ **Session Persistence** - Automatic login restoration
- 📋 **Chat History** - Complete conversation storage
- 📝 **Markdown Support** - Rich text with syntax highlighting  
- 🔐 **Token Security** - Proper expiration handling
- 🎨 **UI Polish** - Loading states and animations
- 🐛 **Bug Fixes** - UUID generation, scrollbar behavior

## 📜 Documentation

- **Server API**: `http://localhost:3500/docs` (FastAPI auto-docs)
- **Architecture**: Microservices with Redis message streaming
- **Security**: Token-based sessions with 1-hour expiry
- **Persistence**: localStorage + Redis for full session restoration

## 📝 License

MIT License - feel free to use this project as a foundation for your own AI chatbots!

---

**🚀 Built with modern technologies for production-ready AI chat experiences**

👏 **Ready for production** - Just add your OpenAI API key and Redis instance!
