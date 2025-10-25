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
└── client/                # Next.js Frontend
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
- 🤖 **Groq Integration** - Groq API for fast AI responses
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

### Choose Your Setup Method

**🐳 Docker (Recommended)**: Containerized setup with all dependencies
**📦 Local Setup**: Traditional local development environment

---

## 🐳 Docker Setup (Recommended)

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Groq API Key** (free API for AI responses)

### 1. Clone and Configure

```bash
git clone <your-repo-url>
cd fullstack-ai-chatbot

# Copy environment file and edit with your API keys
cp .env-example .env
# Edit .env with your GROQ_API_KEY
```

### 2. Start the Application

```bash
# Start all services (Redis, Server, Worker, Client)
./docker-start.sh

# Or use Docker Compose directly
docker compose up -d --build
```

✅ **All services will be running**:
- 🌐 **Client**: http://localhost:3000
- 🚀 **Server**: http://localhost:8000
- 🔴 **Redis**: localhost:6379
- 📖 **API Docs**: http://localhost:8000/docs

### 3. Start Chatting! 💬

1. Open http://localhost:3000
2. Click "Get Started"
3. Enter your name
4. Chat with the AI!

### Docker Management Commands

```bash
# Development commands
./docker-start.sh              # Start all services
./docker-start.sh dev          # Development mode with hot reload
./docker-start.sh status       # Show service status and logs
./docker-start.sh logs         # View service logs
./docker-start.sh stop         # Stop all services
./docker-start.sh clean        # Clean up containers and volumes

# Production deployment
docker compose -f docker-compose.prod.yml up -d --wait

# Enable optional services
docker compose -f docker-compose.prod.yml --profile nginx up -d
docker compose -f docker-compose.prod.yml --profile monitoring up -d
```

### Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Client    │  │   Server    │  │   Worker    │      │
│  │  (Next.js)  │  │  (FastAPI)  │  │ (AI Proc.)  │      │
│  │    :3000    │  │    :8000    │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                  ┌─────────────┐                         │
│                  │    Redis    │                         │
│                  │    :6379    │                         │
│                  └─────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Local Setup

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Redis** instance (local or cloud)
- **Groq API Key** (free API for AI responses)

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
# Edit .env with your Groq API key

# Configure client environment
cd ../client
cp .env.local.example .env.local
# Edit with your API URLs
```

### 2. Start the Server (Terminal 1)

```bash
cd server
./start_server.sh
```

✅ Server runs on `http://localhost:8000`:
- 🏠 Health: `GET /health`
- 🎫 Token: `POST /token`
- 📋 History: `GET /chat_history`
- 🔌 WebSocket: `ws://localhost:8000/chat`
- 📖 Docs: `http://localhost:8000/docs`

### 3. Start the Worker (Terminal 2)

```bash
cd worker
python main.py
```

✅ Worker will consume Redis streams and process AI requests

### 4. Start the Client (Terminal 3)

```bash
cd client
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

### Environment Strategy
- **Development**: Local `.env` files for each service
- **Production**: Environment variables via CI/CD secrets
- **Client URLs**: Build-time configuration (cannot change at runtime)

### Environment Files
```bash
.env                    # Root environment (Redis, API keys, CORS)
server/.env            # Server-specific config (optional)
worker/.env            # Worker-specific config (optional)
client/.env.local      # Client-specific config (API URLs)
```

### Production Configuration

#### Required Runtime Secrets
```env
# AI Model Integration
GROQ_API_KEY=your_groq_api_key

# Database Authentication
REDIS_PASSWORD=your_secure_redis_password
REDIS_USER=default

# Security Configuration
CORS_ORIGINS=https://yourdomain.com,http://client:3000
TOKEN_EXPIRY_HOURS=1

# Optional: Monitoring
GRAFANA_ADMIN_PASSWORD=secure_password
```

#### Client Build-Time Variables
```env
# These are baked into the client image at build time
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

### Development Configuration

#### Local Development Setup
```env
# .env (root)
GROQ_API_KEY=your_groq_api_key
REDIS_PASSWORD=dev_password
CORS_ORIGINS=http://localhost:3000,http://client:3000

# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Key Settings
- **Session Duration**: 1 hour (configurable via `TOKEN_EXPIRY_HOURS`)
- **Chat Context**: Last 10 messages sent to AI model
- **Auto-Reconnect**: 3-second delay with exponential backoff
- **Resource Limits**: Optimized for production workloads
- **Health Checks**: 30-second intervals with 3 retries

## 🔄 CI/CD Workflows

### Automated Pipeline Overview

The project includes three main GitHub Actions workflows:

#### 1. Build and Push (`build-and-push.yml`)
**Triggers**: Push to main (after CI success) or version tags (`v*`)
- 🏗️ **Multi-architecture builds** (AMD64 + ARM64)
- 🔒 **Security scanning** with SBOM generation
- 📦 **Environment-specific client images**
- 🧹 **Build cache optimization**

#### 2. Deploy to Staging (`deploy-staging.yml`)
**Triggers**: After successful image build on main branch
- 🚀 **Automatic deployment** to staging environment
- 🏥 **Health checks** for all services
- 📢 **Slack notifications** on success/failure
- 🧹 **Container cleanup** after deployment

#### 3. Deploy to Production (`deploy-production.yml`)
**Triggers**: Version tag push (`v*`) or manual dispatch
- 💾 **Automatic backup** of current deployment
- 🔄 **Zero-downtime rolling deployment**
- 🏥 **Comprehensive health checks**
- 📦 **Automatic rollback** on failure
- 🔒 **Production-grade security**

### Workflow Features

#### Image Tagging Strategy
```bash
# Server/Worker (environment-agnostic)
ghcr.io/org/repo/server:latest
ghcr.io/org/repo/server:v1.0.0

# Client (environment-specific)
ghcr.io/org/repo/client:latest-staging
ghcr.io/org/repo/client:v1.0.0-production
```

#### Deployment Safety
- **Staging**: Automatic deployment with health checks
- **Production**: Backup → Deploy → Verify → Rollback on failure
- **Manual Override**: `force_deploy` input to skip health checks

## 🐞 Troubleshooting

### � CI/CeD Issues

#### Deployment Failures
```bash
# Check workflow logs in GitHub Actions
# Common issues:
- Missing required secrets (GROQ_API_KEY, SSH keys)
- Health check timeouts (services not ready)
- Image pull failures (registry authentication)

# Manual deployment verification
ssh user@server 'docker compose -f docker-compose.prod.yml ps'
```

#### Image Build Problems
```bash
# Check build logs in GitHub Actions
# Common issues:
- Multi-architecture build failures
- Client environment variable configuration
- Registry authentication issues

# Local build testing
docker buildx build --platform linux/amd64,linux/arm64 ./server
```

#### Rollback Issues
```bash
# Production rollback is automatic on health check failure
# Manual rollback if needed:
ssh user@production-server << 'EOF'
  cd latest_backup
  docker compose -f docker-compose.prod.yml up -d
EOF
```

### 🐳 Docker Issues

#### Service Health Checks
```bash
# Check service health status
docker compose ps
docker compose logs [service-name]

# Test individual health endpoints
curl -f http://localhost:8000/health  # Server
curl -f http://localhost:3000         # Client
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping  # Redis
```

#### Environment Configuration
```bash
# Verify environment files
ls -la .env*

# Check loaded environment in containers
docker compose exec server printenv | grep -E "(REDIS|GROQ|CORS)"
docker compose exec worker printenv | grep GROQ_API_KEY
```

#### Resource Issues
```bash
# Check resource usage
docker stats

# Adjust resource limits in docker-compose.prod.yml
services:
  worker:
    deploy:
      resources:
        limits:
          memory: 2G  # Increase if needed
          cpus: "2.0"
```

#### Network Connectivity
```bash
# Test inter-service communication
docker compose exec client curl http://server:8000/health
docker compose exec server redis-cli -h redis -a $REDIS_PASSWORD ping

# Check network configuration
docker network ls
docker network inspect fullstack-ai-chatbot_chatbot-network-prod
```

### 📦 Local Development Issues

#### Client URL Problems
```bash
# Client URLs are build-time only - cannot change at runtime
# For local development, ensure client/.env.local has:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# For production, URLs are baked into the image during CI/CD
```

#### Service Communication
```bash
# Internal Docker network communication
docker compose exec client curl http://server:8000/health

# External access (from host)
curl http://localhost:8000/health
curl http://localhost:3000

# WebSocket testing
wscat -c ws://localhost:8000/chat?token=your_token
```

#### Common Solutions
- **Server won't start**: Check Redis connection and GROQ_API_KEY
- **Client build fails**: Verify Node.js version (18+) and run `npm install`
- **WebSocket errors**: Ensure token is valid and not expired
- **CORS errors**: Check CORS_ORIGINS includes your client URL
- **Redis connection**: Verify REDIS_PASSWORD matches in all services
- **AI responses fail**: Confirm GROQ_API_KEY is valid and has credits

#### Performance Optimization
```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use development mode for hot reload
./docker-start.sh dev

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🧪 Testing

### Client Testing
```bash
cd client
npm test                       # Run Jest tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

### Server Testing
```bash
cd server
python -m pytest             # Run Python tests
```

### Worker Testing
```bash
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

## 📡 API Endpoints

### REST API
- `GET /health` - Health check endpoint
- `POST /token` - Generate chat token (form data: `name`)
- `GET /chat_history?token=<token>` - Retrieve chat history with messages

**Response Codes:**
- `200` - Success
- `400` - Invalid request or expired session
- `500` - Internal server error

### WebSocket
- `ws://localhost:8000/chat?token=<token>` - Real-time bidirectional chat

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
uvicorn main:api --reload --host 0.0.0.0 --port 8000
```

### Client Development
```bash
cd client
npm run dev
```

## 📚 Technologies Used

### Backend Stack
- **FastAPI 0.115.0** - Modern Python web framework with automatic OpenAPI docs
- **Uvicorn** - ASGI server with hot reload support
- **WebSockets 13.1** - Real-time bidirectional communication
- **Redis 5.2.0** - In-memory data store for sessions and message streaming
- **Pydantic 2.10.1** - Data validation and serialization
- **Python-multipart** - Form data handling for token generation

### AI Processing
- **Groq 0.32.0** - AI model integration for GPT responses
- **Redis Streams** - Async message queue processing
- **Python-dotenv** - Environment variable management
- **Asyncio** - Asynchronous programming for performance

### Frontend Stack
- **Next.js 15.5.4** - React framework with App Router and Turbopack
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom animations
- **Framer Motion 12.23.21** - Smooth animations and transitions

### UI Libraries
- **React Hot Toast** - Beautiful notification system
- **React Markdown 10.1.0** - Markdown rendering with GFM support
- **Rehype Highlight** - Syntax highlighting for code blocks
- **Lucide React** - Modern icon library

### DevOps & Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **GitHub Actions** - CI/CD pipeline automation
- **GitHub Container Registry** - Multi-architecture image storage
- **Redis Stack Server 7.4.0** - Production-ready Redis with modules
- **Nginx Alpine** - Lightweight reverse proxy (optional)
- **Prometheus & Grafana** - Monitoring and metrics (optional)

### Security & Quality
- **SBOM Generation** - Software Bill of Materials for security
- **Multi-architecture builds** - AMD64 and ARM64 support
- **Health checks** - Comprehensive service monitoring
- **Automatic rollback** - Production deployment safety
- **Resource limits** - Container resource management

## 🚀 Deployment

### 🤖 Automated CI/CD Pipeline

**Complete automation from code to production!** The project includes a comprehensive CI/CD pipeline with GitHub Actions:

#### Deployment Flow
```bash
# 1. Push to main → Automatic staging deployment
git push origin main

# 2. Create version tag → Automatic production deployment
git tag v1.0.0
git push origin v1.0.0
```

#### Pipeline Features
- ✅ **Multi-architecture builds** (AMD64 + ARM64)
- 🔒 **Security scanning** with SBOM generation
- 🏗️ **Environment-specific client builds** (staging vs production URLs)
- 🔄 **Zero-downtime deployments** with health checks
- 📦 **Automatic rollback** on production failures
- 🧹 **Image cleanup** to manage registry storage
- 📢 **Slack notifications** for deployment status

#### Container Registry Strategy
- **Server/Worker**: Environment-agnostic images (`latest`, `v1.0.0`)
- **Client**: Environment-specific builds (`latest-staging`, `v1.0.0-production`)
- **Registry**: GitHub Container Registry (`ghcr.io`)

### 🐳 Production Docker Setup

#### Optimized Production Configuration

The `docker-compose.prod.yml` provides enterprise-ready deployment:

```yaml
# Resource-optimized services
server:
  deploy:
    resources:
      limits: { memory: 512M, cpus: "0.5" }
    replicas: 1

worker:
  deploy:
    resources:
      limits: { memory: 1G, cpus: "1.0" }
    replicas: 1

# Health checks for all services
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Optional Production Services
```bash
# Enable Nginx reverse proxy
docker compose -f docker-compose.prod.yml --profile nginx up -d

# Enable monitoring stack (Prometheus + Grafana)
docker compose -f docker-compose.prod.yml --profile monitoring up -d
```

### 🔧 Manual Deployment (Advanced)

#### Required GitHub Secrets
For automated deployments, configure these secrets in your repository:

```bash
# Staging Environment
STAGING_SSH_PRIVATE_KEY, STAGING_USER, STAGING_HOST
STAGING_GROQ_API_KEY, STAGING_REDIS_PASSWORD
STAGING_API_URL, STAGING_WS_URL

# Production Environment
PRODUCTION_SSH_PRIVATE_KEY, PRODUCTION_USER, PRODUCTION_HOST
PRODUCTION_GROQ_API_KEY, PRODUCTION_REDIS_PASSWORD
PRODUCTION_API_URL, PRODUCTION_WS_URL, PRODUCTION_DOMAIN

# Optional: Slack notifications
SLACK_WEBHOOK_URL
```

#### Manual Production Deployment
```bash
# Set environment variables
export CLIENT_ENV=production
export REGISTRY=ghcr.io
export IMAGE_NAME=your-org/fullstack-ai-chatbot
export IMAGE_TAG=v1.0.0

# Deploy with specific version
docker compose -f docker-compose.prod.yml up -d --wait

# Or deploy staging
export CLIENT_ENV=staging
docker compose -f docker-compose.prod.yml up -d --wait
```

#### Deployment Features
- 🔄 **Automatic rollback** on production health check failures
- 💾 **Deployment backups** with timestamp-based restore points
- 🏥 **Comprehensive health checks** for all services
- 🔒 **Secure secrets management** via environment variables
- 📊 **Resource monitoring** with optional Prometheus/Grafana stack

### 🌐 Cloud Platform Support

#### Container Orchestration
- **Docker Swarm**: Use `docker-compose.prod.yml` directly
- **Kubernetes**: Convert with Kompose or use Helm charts
- **AWS ECS/Fargate**: Deploy with task definitions
- **Azure Container Instances**: Use container groups
- **Google Cloud Run**: Deploy individual services

#### Platform-as-a-Service
- **Railway**: Connect GitHub repo for auto-deployment
- **Render**: Use Docker deployment with health checks
- **DigitalOcean App Platform**: Multi-service app configuration

## 🔄 Recent Updates

### 🚀 Production-Ready CI/CD Pipeline
- ✅ **Automated deployments** with GitHub Actions
- 🏗️ **Multi-architecture builds** (AMD64 + ARM64)
- 🔒 **Security scanning** with SBOM generation
- 🔄 **Zero-downtime deployments** with health checks
- 📦 **Automatic rollback** on production failures
- 🧹 **Container registry cleanup** and optimization

### 🐳 Enhanced Docker Infrastructure
- 🏥 **Comprehensive health checks** for all services
- 📊 **Resource limits** and performance optimization
- 🔧 **Optional services** (Nginx proxy, monitoring stack)
- 🌐 **Production networking** with custom subnets
- 💾 **Persistent volumes** for data retention

### 🎨 Application Features
- ✨ **Session Persistence** - Automatic login restoration
- 📋 **Chat History** - Complete conversation storage
- 📝 **Markdown Support** - Rich text with syntax highlighting
- 🔐 **Token Security** - Proper expiration handling
- 🎭 **UI Polish** - Loading states and smooth animations
- 🔄 **Auto-reconnection** - Seamless network recovery

## 📜 Documentation

- **Server API**: `http://localhost:8000/docs` (FastAPI auto-docs)
- **Architecture**: Microservices with Redis message streaming
- **Security**: Token-based sessions with 1-hour expiry
- **Persistence**: localStorage + Redis for full session restoration

## 📝 License

MIT License - feel free to use this project as a foundation for your own AI chatbots!

---
