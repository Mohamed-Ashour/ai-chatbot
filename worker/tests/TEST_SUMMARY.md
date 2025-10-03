# Worker Component Tests

This directory contains comprehensive test cases for the worker component of the fullstack AI chatbot.

## Test Structure

### Unit Tests
- `test_schema.py` - Tests for message schema and data models
- `test_redis_config.py` - Tests for Redis configuration and connection management
- `test_cache.py` - Tests for Redis cache operations (chat history management)
- `test_stream.py` - Tests for Redis stream consumption
- `test_producer.py` - Tests for Redis stream production
- `test_gpt.py` - Tests for AI model integration (Groq API)
- `test_main.py` - Tests for the main worker process and message processing logic

### Integration Tests
- `test_integration.py` - End-to-end tests that verify all components work together

### Test Configuration
- `conftest.py` - Pytest fixtures and configuration
- `pytest.ini` - Pytest settings and options
- `requirements-test.txt` - Test dependencies

## Running Tests

### Prerequisites
Install test dependencies:
```bash
cd worker
pip install -r tests/requirements-test.txt
```

### Run All Tests
```bash
# From worker directory
pytest

# Or from project root
pytest worker/tests/
```

### Run Specific Test Files
```bash
pytest tests/test_main.py
pytest tests/test_gpt.py
pytest tests/test_integration.py
```

### Run Tests with Coverage
```bash
pytest --cov=src --cov-report=html
```

### Run Only Integration Tests
```bash
pytest tests/test_integration.py
```

### Run Tests with Output
```bash
pytest -v -s
```

## Test Coverage

The test suite provides comprehensive coverage of:

### Core Functionality
- ✅ Message processing pipeline
- ✅ Redis stream consumption and production
- ✅ Chat history caching and retrieval
- ✅ AI model integration (Groq API)
- ✅ Session management and expiration
- ✅ Error handling and recovery

### Edge Cases
- ✅ Expired sessions
- ✅ Empty chat history
- ✅ Network failures
- ✅ Invalid message formats
- ✅ API errors
- ✅ Redis connection issues

### Integration Scenarios
- ✅ End-to-end message processing
- ✅ Component initialization order
- ✅ Concurrent message handling
- ✅ Error propagation through the stack

## Key Test Features

### Async Testing
All tests are designed to work with Python's async/await patterns using pytest-asyncio.

### Mocking Strategy
- External dependencies (Redis, Groq API) are mocked
- Tests focus on business logic rather than external service availability
- Realistic mock responses simulate actual service behavior

### Fixtures
Reusable fixtures provide:
- Mock Redis clients
- Sample message data
- Chat history examples
- Component instances

### Error Testing
Comprehensive error scenarios ensure robust error handling:
- Network timeouts
- API failures
- Data corruption
- Resource exhaustion

## Understanding the Worker

Based on the test cases, here's what the worker component does:

### Architecture
The worker is a **message processor** that:
1. Consumes messages from Redis streams
2. Retrieves chat history from Redis cache
3. Sends conversation context to AI model (Groq)
4. Publishes AI responses back to Redis streams
5. Updates chat history cache

### Data Flow
```
1. Redis Stream (message_channel) 
   → StreamConsumer.consume_stream()
2. Cache.get_chat_history() 
   → Retrieve last 10 messages
3. GPT.query() 
   → Send context to AI model
4. Producer.add_to_stream() 
   → Publish response
5. Cache.add_messages_to_cache() 
   → Store conversation
```

### Key Components

#### Redis Integration
- **StreamConsumer**: Reads from `message_channel` stream
- **Producer**: Writes to `response_channel_{token}` streams  
- **Cache**: Manages JSON-based chat history with RedisJSON

#### AI Integration
- **GPT**: Interfaces with Groq API using the `openai/gpt-oss-20b` model
- Maintains conversation context (last 10 messages)
- Handles API errors gracefully

#### Message Processing
- **Session Management**: Token-based sessions with 1-hour TTL
- **Message Structure**: User/assistant messages with timestamps
- **Error Handling**: Graceful degradation on failures

### Configuration
The worker requires these environment variables:
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`
- `GROQ_API_KEY`

### Deployment
The worker runs as a continuous loop:
- Blocks on Redis stream consumption
- Processes messages sequentially
- Handles graceful shutdown (Ctrl+C)
- Cleans up Redis connections

This test suite ensures all these components work correctly both individually and together.