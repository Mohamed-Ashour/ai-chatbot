import pytest
import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
import httpx
from typing import AsyncGenerator

# Import the main application
from main import api
from src.redis.config import Redis
from src.schema.chat import Chat, Message, SourceEnum

# Test environment variables
TEST_ENV = {
    "REDIS_HOST": "localhost",
    "REDIS_PORT": "6379",
    "REDIS_USER": "default",
    "REDIS_PASSWORD": "testpassword",
    "APP_ENV": "test"
}

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Setup test environment variables"""
    for key, value in TEST_ENV.items():
        os.environ[key] = value


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(api)


@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app"""
    async with httpx.AsyncClient(app=api, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_redis():
    """Create a mock Redis client for testing"""
    redis_client = AsyncMock()
    
    # Create a mock for the JSON operations
    json_mock = MagicMock()
    json_mock.set = AsyncMock(return_value=True)
    json_mock.get = AsyncMock(return_value=None)
    redis_client.json = MagicMock(return_value=json_mock)
    
    # Mock basic operations
    redis_client.exists = AsyncMock(return_value=0)
    redis_client.expire = AsyncMock(return_value=True)
    redis_client.ttl = AsyncMock(return_value=3600)
    redis_client.set = AsyncMock(return_value=True)
    redis_client.get = AsyncMock(return_value=None)
    
    # Mock stream operations
    redis_client.xadd = AsyncMock(return_value=b'stream-id-123')
    redis_client.xread = AsyncMock(return_value=[])
    redis_client.xdel = AsyncMock(return_value=1)
    
    return redis_client


@pytest.fixture
def fake_redis():
    """Create a more comprehensive fake Redis client for testing"""
    from redis.commands.json.path import Path
    
    class FakeRedis:
        def __init__(self):
            self._data = {}
            self._json_data = {}
            self._streams = {}
            self._expiry = {}
        
        async def exists(self, key):
            return 1 if key in self._data or key in self._json_data else 0
        
        async def set(self, key, value, ex=None):
            self._data[key] = value
            if ex:
                import time
                self._expiry[key] = time.time() + ex
            return True
        
        async def get(self, key):
            if key in self._expiry:
                import time
                if time.time() > self._expiry[key]:
                    del self._data[key]
                    del self._expiry[key]
                    return None
            return self._data.get(key)
        
        async def expire(self, key, seconds):
            if key in self._data or key in self._json_data:
                import time
                self._expiry[key] = time.time() + seconds
                return True
            return False
        
        async def ttl(self, key):
            if key in self._expiry:
                import time
                remaining = self._expiry[key] - time.time()
                return max(0, int(remaining))
            return -1
        
        def json(self):
            return FakeRedisJSON(self)
        
        async def xadd(self, name, fields, id="*"):
            if name not in self._streams:
                self._streams[name] = []
            
            import time
            # Generate unique message ID by including microseconds and a counter
            timestamp_ms = int(time.time() * 1000)
            # Ensure uniqueness by checking existing messages
            counter = 0
            while True:
                message_id = f"{timestamp_ms}-{counter}"
                if not any(msg_id == message_id for msg_id, _ in self._streams[name]):
                    break
                counter += 1
                # Also increment timestamp if we have too many collisions
                if counter > 100:
                    timestamp_ms += 1
                    counter = 0
            
            self._streams[name].append((message_id, fields))
            return message_id.encode()
        
        async def xread(self, streams, count=None, block=None):
            result = []
            for stream_name in streams:
                if stream_name in self._streams and self._streams[stream_name]:
                    messages = self._streams[stream_name][:count] if count else self._streams[stream_name]
                    if messages:
                        result.append((stream_name.encode() if isinstance(stream_name, str) else stream_name, messages))
            return result
        
        async def xdel(self, stream, *message_ids):
            if stream in self._streams:
                original_length = len(self._streams[stream])
                self._streams[stream] = [
                    (msg_id, fields) for msg_id, fields in self._streams[stream]
                    if msg_id not in message_ids
                ]
                return original_length - len(self._streams[stream])
            return 0
    
    class FakeRedisJSON:
        def __init__(self, redis_client):
            self._redis = redis_client
        
        async def set(self, key, path, data):
            if key in self._redis._expiry:
                import time
                if time.time() > self._redis._expiry[key]:
                    if key in self._redis._json_data:
                        del self._redis._json_data[key]
                    if key in self._redis._expiry:
                        del self._redis._expiry[key]
                    return None
            
            self._redis._json_data[key] = data
            return True
        
        async def get(self, key, path=None):
            if key in self._redis._expiry:
                import time
                if time.time() > self._redis._expiry[key]:
                    if key in self._redis._json_data:
                        del self._redis._json_data[key]
                    if key in self._redis._expiry:
                        del self._redis._expiry[key]
                    return None
            
            return self._redis._json_data.get(key)
    
    return FakeRedis()


@pytest.fixture
def mock_redis_config(fake_redis):
    """Mock the Redis configuration to use fake Redis"""
    original_create_connection = Redis.create_connection
    
    async def mock_create_connection(self):
        return fake_redis
    
    Redis.create_connection = mock_create_connection
    yield
    Redis.create_connection = original_create_connection


@pytest.fixture
def sample_chat_session():
    """Create a sample chat session for testing"""
    return Chat(
        token="test-token-123",
        name="Test User",
        messages=[
            Message(
                id="msg-1",
                msg="Hello, world!",
                source=SourceEnum.user
            )
        ]
    )


@pytest.fixture
def sample_message():
    """Create a sample message for testing"""
    return Message(
        id="test-msg-id",
        msg="Test message content",
        source=SourceEnum.user
    )


@pytest.fixture
async def websocket_client():
    """Create a WebSocket test client"""
    from fastapi.testclient import TestClient
    client = TestClient(api)
    yield client


@pytest.fixture
def mock_producer():
    """Mock Redis stream producer"""
    mock = AsyncMock()
    mock.add_to_stream.return_value = "test-message-id"
    return mock


@pytest.fixture
def mock_consumer():
    """Mock Redis stream consumer"""
    mock = AsyncMock()
    mock.consume_stream.return_value = [
        ("response_channel_test", [
            ("msg-id-1", {b'message': b'Test AI response'})
        ])
    ]
    mock.delete_message.return_value = True
    return mock


@pytest.fixture
def mock_cache():
    """Mock Redis cache"""
    mock = AsyncMock()
    mock.get_chat_history.return_value = {
        "token": "test-token",
        "name": "Test User",
        "messages": []
    }
    return mock


class AsyncContextManager:
    """Helper class for async context managers in tests"""
    def __init__(self, async_obj):
        self.async_obj = async_obj

    async def __aenter__(self):
        return self.async_obj

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass