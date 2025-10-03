"""
Configuration for pytest with fixtures for testing the worker component.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from src.redis.config import Redis
from src.redis.cache import Cache
from src.redis.stream import StreamConsumer
from src.redis.producer import Producer
from src.model.gpt import GPT
from src.schema.chat import Message, SourceEnum

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_redis_client():
    """Mock Redis client for testing."""
    mock_client = AsyncMock()
    mock_client.aclose = AsyncMock()
    mock_client.xread = AsyncMock()
    mock_client.xadd = AsyncMock()
    mock_client.xdel = AsyncMock()
    mock_client.expire = AsyncMock()
    
    # Create a proper mock for json() that returns an object with async methods
    json_mock = MagicMock()
    json_mock.get = AsyncMock()
    json_mock.arrappend = AsyncMock()
    
    # Make json() return the json_mock object, not call it
    mock_client.json = MagicMock(return_value=json_mock)
    
    return mock_client

@pytest.fixture
def mock_redis_config(mock_redis_client):
    """Mock Redis configuration."""
    mock_config = MagicMock(spec=Redis)
    mock_config.create_connection = AsyncMock(return_value=mock_redis_client)
    return mock_config

@pytest.fixture
def cache(mock_redis_client):
    """Create Cache instance with mocked Redis client."""
    return Cache(mock_redis_client)

@pytest.fixture
def stream_consumer(mock_redis_client):
    """Create StreamConsumer instance with mocked Redis client."""
    return StreamConsumer(mock_redis_client)

@pytest.fixture
def producer(mock_redis_client):
    """Create Producer instance with mocked Redis client."""
    return Producer(mock_redis_client)

@pytest.fixture
def mock_gpt():
    """Mock GPT model for testing."""
    mock_gpt = AsyncMock(spec=GPT)
    mock_gpt.query = AsyncMock()
    return mock_gpt

@pytest.fixture
def sample_message():
    """Sample Message object for testing."""
    return Message(
        msg="Hello, how are you?",
        source=SourceEnum.user
    )

@pytest.fixture
def sample_assistant_message():
    """Sample assistant Message object for testing."""
    return Message(
        msg="I'm doing well, thank you for asking!",
        source=SourceEnum.assistant
    )

@pytest.fixture
def sample_chat_history():
    """Sample chat history data."""
    return {
        "messages": [
            {
                "id": "msg1",
                "msg": "Hello",
                "timestamp": "2024-01-01T10:00:00",
                "source": "user"
            },
            {
                "id": "msg2", 
                "msg": "Hi there!",
                "timestamp": "2024-01-01T10:00:01",
                "source": "assistant"
            }
        ]
    }

@pytest.fixture
def sample_token():
    """Sample token for testing."""
    return "test_token_123"

@pytest.fixture
def sample_stream_response():
    """Sample Redis stream response."""
    return [
        (b'message_channel', [
            (b'1234567890123-0', {b'test_token_123': b'Hello, how are you?'})
        ])
    ]