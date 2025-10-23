# Project Structure

## Root Directory Organization

```
fullstack-ai-chatbot/
├── client/                    # Next.js Frontend Application
├── server/                    # FastAPI Backend Server
├── worker/                    # AI Processing Worker
├── docs/                      # Documentation files
├── scripts/                   # Utility scripts
├── .github/                   # CI/CD workflows
├── docker-compose.yml         # Development Docker setup
├── docker-compose.prod.yml    # Production Docker setup
└── docker-start.sh           # Docker management script
```

## Client Structure (Next.js)

```
client/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/health/        # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ConnectionStatus.tsx
│   │   ├── Message.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── SessionRestoreLoader.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── WelcomeModal.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useChat.ts         # Main chat logic
│   ├── lib/                   # Utility functions
│   │   ├── session.ts         # Session management
│   │   └── utils.ts           # General utilities
│   └── types/                 # TypeScript definitions
│       └── chat.ts            # Chat-related types
├── __tests__/                 # Jest test files
├── public/                    # Static assets
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── tailwind.config.js         # Tailwind CSS configuration
```

## Server Structure (FastAPI)

```
server/
├── src/
│   ├── routes/                # API route handlers
│   │   └── chat.py            # Chat endpoints and WebSocket
│   ├── redis/                 # Redis integration
│   │   ├── cache.py           # Session and history caching
│   │   ├── config.py          # Redis connection setup
│   │   ├── producer.py        # Stream message publishing
│   │   └── stream.py          # Stream consumption utilities
│   ├── socket/                # WebSocket management
│   │   ├── connection.py      # Connection handling
│   │   └── utils.py           # Socket utilities
│   └── schema/                # Pydantic data models
│       └── chat.py            # Message and chat schemas
├── tests/                     # Pytest test files
├── main.py                    # FastAPI application entry
├── requirements.txt           # Python dependencies
└── Dockerfile                 # Container configuration
```

## Worker Structure (AI Processing)

```
worker/
├── src/
│   ├── model/                 # AI model integration
│   │   └── gpt.py             # Groq/GPT API client
│   ├── redis/                 # Redis integration (shared)
│   │   ├── cache.py           # Session and history caching
│   │   ├── config.py          # Redis connection setup
│   │   ├── producer.py        # Stream message publishing
│   │   └── stream.py          # Stream consumption
│   └── schema/                # Pydantic data models (shared)
│       └── chat.py            # Message and chat schemas
├── tests/                     # Pytest test files
├── main.py                    # Worker process entry point
├── requirements.txt           # Python dependencies
└── Dockerfile                 # Container configuration
```

## Shared Patterns

### Code Organization
- **Separation of Concerns**: Each service has distinct responsibilities
- **Shared Schemas**: Common data models between server and worker
- **Modular Structure**: Clear separation of routes, models, and utilities
- **Test Coverage**: Comprehensive test suites for all components

### File Naming Conventions
- **Python**: Snake_case for files and functions
- **TypeScript**: PascalCase for components, camelCase for utilities
- **Configuration**: Lowercase with extensions (.env, .yml, .json)

### Import Patterns
- **Relative Imports**: Use `src/` prefix for internal modules
- **Absolute Imports**: Use `@/` alias for client-side imports
- **Type Imports**: Separate type imports in TypeScript files

### Environment Configuration
- **Development**: Local .env files for each service
- **Production**: Docker environment variables
- **Secrets**: API keys and credentials via environment variables only