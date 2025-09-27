# Fullstack AI Chatbot Architecture

## System Overview Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        subgraph "Next.js React Client"
            ChatPage[ChatPage Component]
            WelcomeModal[Welcome Modal]
            MessageList[Message List]
            MessageInput[Message Input]
            TypingIndicator[Typing Indicator]
            ConnectionStatus[Connection Status]
            
            subgraph "Hooks & Utils"
                useWebSocket[useWebSocket Hook]
                useSessionRestore[useSessionRestore Hook]
                sessionStorage[Session Storage Utils]
            end
        end
    end

    subgraph "Server Layer"
        subgraph "FastAPI Server"
            WSEndpoint[WebSocket Endpoint<br/>/ws]
            SessionManager[Session Manager]
            ConnectionManager[Connection Manager]
            WSHandler[WebSocket Handler]
        end
        
        subgraph "Background Worker"
            WorkerProcess[Worker Process]
            StreamConsumer[Stream Consumer]
            MessageProcessor[Message Processor]
            AIService[AI Service Integration]
        end
    end

    subgraph "Data Layer"
        subgraph "Redis"
            ChatStreams[Chat Streams<br/>chat:session_id]
            SessionCache[Session Cache<br/>session:session_id]
            UserSessions[User Sessions]
        end
    end

    %% Client Internal Flow
    Browser --> ChatPage
    ChatPage --> WelcomeModal
    ChatPage --> MessageList
    ChatPage --> MessageInput
    ChatPage --> ConnectionStatus
    ChatPage --> useWebSocket
    ChatPage --> useSessionRestore
    useWebSocket --> sessionStorage
    useSessionRestore --> sessionStorage

    %% Client-Server Communication
    useWebSocket -.->|WebSocket Connection| WSEndpoint
    MessageInput -.->|Send Message| WSEndpoint
    WSEndpoint -.->|Receive Message| MessageList
    WSEndpoint -.->|Connection Status| ConnectionStatus
    WSEndpoint -.->|Typing Events| TypingIndicator

    %% Server Internal Flow
    WSEndpoint --> WSHandler
    WSHandler --> SessionManager
    WSHandler --> ConnectionManager
    SessionManager --> SessionCache
    ConnectionManager --> ChatStreams

    %% Background Processing
    ChatStreams -->|Stream Events| StreamConsumer
    StreamConsumer --> WorkerProcess
    WorkerProcess --> MessageProcessor
    MessageProcessor --> AIService
    AIService --> MessageProcessor
    MessageProcessor -->|AI Response| ChatStreams

    %% Response Flow Back to Client
    ChatStreams -.->|New Messages| WSHandler
    WSHandler -.->|Broadcast| useWebSocket

    %% Styling
    classDef client fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef server fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px  
    classDef data fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef websocket fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,stroke-dasharray: 5 5

    class Browser,ChatPage,WelcomeModal,MessageList,MessageInput,TypingIndicator,ConnectionStatus,useWebSocket,useSessionRestore,sessionStorage client
    class WSEndpoint,SessionManager,ConnectionManager,WSHandler,WorkerProcess,StreamConsumer,MessageProcessor,AIService server
    class ChatStreams,SessionCache,UserSessions data
```

## Component Interaction Flow

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant WS as WebSocket Server
    participant SM as Session Manager  
    participant R as Redis
    participant W as Worker
    participant AI as AI Service

    Note over C,AI: User Session Initialization
    C->>WS: Connect WebSocket
    WS->>SM: Create/Restore Session
    SM->>R: Check/Create Session Cache
    R-->>SM: Session Data
    SM-->>WS: Session Ready
    WS-->>C: Connection Established

    Note over C,AI: Message Flow
    C->>WS: Send Message
    WS->>R: Add to Chat Stream
    WS-->>C: Message Acknowledged
    
    R->>W: Stream Event
    W->>AI: Process Message
    AI-->>W: AI Response
    W->>R: Add AI Response to Stream
    
    R->>WS: New Message Event
    WS-->>C: Broadcast AI Response
    C->>C: Update Message List

    Note over C,AI: Connection Management
    C->>WS: Heartbeat/Ping
    WS-->>C: Pong
    
    Note over C,AI: Session Persistence
    C->>C: Store Session in localStorage
    WS->>R: Update Session Cache
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Frontend State"
        A[User Input] --> B[Message State]
        B --> C[WebSocket Send]
        H[WebSocket Receive] --> I[Update Messages]
        I --> J[Re-render UI]
    end
    
    subgraph "Backend Processing"
        C --> D[FastAPI Handler]
        D --> E[Redis Stream]
        E --> F[Worker Process]
        F --> G[AI Processing]
        G --> E
        E --> H
    end
    
    subgraph "Session Management"
        K[Session Storage] --> L[Session Restore]
        L --> M[Reconnect WebSocket]
        D --> N[Session Cache]
        N --> O[User Context]
    end

    style A fill:#ffeb3b
    style G fill:#4caf50
    style E fill:#f44336
    style I fill:#2196f3
```

## Key Components Description

### Client Side (Next.js React)
- **ChatPage**: Main chat interface component managing overall state
- **useWebSocket**: Custom hook handling WebSocket connection and message flow  
- **useSessionRestore**: Hook for persisting and restoring user sessions
- **Message Components**: UI components for displaying messages, input, typing indicators
- **Session Storage**: Browser storage utilities for session persistence

### Server Side (FastAPI)
- **WebSocket Endpoint**: Main `/ws` endpoint handling real-time connections
- **Session Manager**: Manages user sessions and authentication state
- **Connection Manager**: Handles WebSocket connection lifecycle
- **Worker Process**: Background process consuming Redis streams for AI processing

### Data Layer (Redis)
- **Chat Streams**: Real-time message streams per session (`chat:session_id`)
- **Session Cache**: User session data and state (`session:session_id`)
- **Message Storage**: Persistent chat history and metadata

## Key Features

### Real-time Communication
- WebSocket connections for bi-directional communication
- Message acknowledgments and delivery confirmation
- Connection status monitoring and reconnection logic

### Session Management
- Persistent sessions across page reloads
- Session restoration with message history
- User context maintenance

### Scalability Design
- Redis streams for horizontal scaling
- Background worker processes for AI processing
- Stateless FastAPI server design

### Error Handling & Resilience
- WebSocket reconnection on connection loss
- Worker process health monitoring (needs improvement for sleep/wake cycles)
- Graceful degradation for offline scenarios

## Current Known Issues
1. **Worker Stale Connections**: Worker process stops consuming after MacBook sleep - requires manual restart
2. **Connection Monitoring**: Limited health checks for Redis connections
3. **Error Recovery**: Basic error handling in place but could be enhanced

## Suggested Improvements
1. Implement Redis connection health checks in worker
2. Add automatic worker process restart capability  
3. Enhanced error boundaries in React client
4. Message persistence and offline queue
5. Load balancing for multiple worker instances