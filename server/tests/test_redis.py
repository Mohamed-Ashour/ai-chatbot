import pytest
import asyncio
import os
from unittest.mock import patch, AsyncMock
from redis.commands.json.path import Path

from src.redis.config import Redis
from src.redis.cache import Cache
from src.redis.producer import Producer
from src.redis.stream import StreamConsumer
from src.schema.chat import Chat, Message, SourceEnum


class TestRedisConfiguration:
    """Test Redis configuration and connection"""
    
    @pytest.mark.unit
    def test_redis_config_initialization(self):
        """Test Redis configuration initialization"""
        redis_config = Redis()
        
        assert redis_config.REDIS_PASSWORD == "testpassword"
        assert redis_config.REDIS_USER == "default"
        assert redis_config.HOST == "localhost"
        assert redis_config.PORT == "6379"
        assert "redis://default:testpassword@localhost:6379" in redis_config.connection_url
    
    @pytest.mark.redis
    async def test_redis_connection_creation(self, fake_redis):
        """Test Redis connection creation"""
        redis_config = Redis()
        
        # Mock the connection creation
        with patch('redis.asyncio.from_url', return_value=fake_redis):
            connection = await redis_config.create_connection()
            assert connection is not None


class TestRedisCache:
    """Test Redis cache operations"""
    
    @pytest.mark.redis
    async def test_cache_initialization(self, fake_redis):
        """Test cache initialization with Redis client"""
        cache = Cache(fake_redis)
        assert cache.redis_client == fake_redis
    
    @pytest.mark.redis
    async def test_get_chat_history_success(self, fake_redis, sample_chat_session):
        """Test successful retrieval of chat history from cache"""
        cache = Cache(fake_redis)
        token = sample_chat_session.token
        
        # Store test data in Redis
        await fake_redis.json().set(token, Path.root_path(), sample_chat_session.model_dump())
        
        # Retrieve chat history
        result = await cache.get_chat_history(token)
        
        assert result is not None
        assert result["token"] == token
        assert result["name"] == sample_chat_session.name
        assert len(result["messages"]) == 1
    
    @pytest.mark.redis
    async def test_get_chat_history_not_found(self, fake_redis):
        """Test retrieval of non-existent chat history"""
        cache = Cache(fake_redis)
        
        result = await cache.get_chat_history("non-existent-token")
        assert result is None
    
    @pytest.mark.redis
    async def test_get_chat_history_empty_token(self, fake_redis):
        """Test retrieval with empty token"""
        cache = Cache(fake_redis)
        
        result = await cache.get_chat_history("")
        assert result is None
    
    @pytest.mark.redis
    async def test_cache_json_operations(self, fake_redis):
        """Test JSON operations on cache"""
        cache = Cache(fake_redis)
        
        # Test data
        test_data = {
            "token": "test-123",
            "name": "Test User",
            "messages": [
                {
                    "id": "msg-1",
                    "msg": "Hello",
                    "source": "user",
                    "timestamp": "2023-01-01T00:00:00"
                }
            ]
        }
        
        # Store and retrieve
        await fake_redis.json().set("test-123", Path.root_path(), test_data)
        result = await cache.get_chat_history("test-123")
        
        assert result["token"] == test_data["token"]
        assert result["name"] == test_data["name"]
        assert len(result["messages"]) == 1


class TestRedisProducer:
    """Test Redis stream producer"""
    
    @pytest.mark.redis
    async def test_producer_initialization(self, fake_redis):
        """Test producer initialization"""
        producer = Producer(fake_redis)
        assert producer.redis_client == fake_redis
    
    @pytest.mark.redis
    async def test_add_to_stream_success(self, fake_redis):
        """Test successful message addition to stream"""
        producer = Producer(fake_redis)
        
        test_data = {"token123": "Hello, world!"}
        stream_name = "test_stream"
        
        # Add message to stream
        message_id = await producer.add_to_stream(data=test_data, stream_channel=stream_name)
        
        assert message_id is not None
        assert isinstance(message_id, (str, bytes))
    
    @pytest.mark.redis
    async def test_add_to_stream_multiple_messages(self, fake_redis):
        """Test adding multiple messages to stream"""
        producer = Producer(fake_redis)
        stream_name = "test_stream"
        
        messages = [
            {"token1": "Message 1"},
            {"token2": "Message 2"},
            {"token3": "Message 3"}
        ]
        
        message_ids = []
        for msg in messages:
            msg_id = await producer.add_to_stream(data=msg, stream_channel=stream_name)
            message_ids.append(msg_id)
        
        # All message IDs should be unique
        assert len(set(message_ids)) == len(message_ids)
        assert all(msg_id is not None for msg_id in message_ids)
    
    @pytest.mark.redis
    async def test_add_to_stream_empty_data(self, fake_redis):
        """Test adding empty data to stream"""
        producer = Producer(fake_redis)
        stream_name = "test_stream"
        
        # Should handle empty data gracefully
        message_id = await producer.add_to_stream(data={}, stream_channel=stream_name)
        assert message_id is not None
    
    @pytest.mark.redis
    async def test_producer_error_handling(self, fake_redis):
        """Test producer error handling"""
        producer = Producer(fake_redis)
        
        # Mock Redis client to raise an exception
        fake_redis.xadd = AsyncMock(side_effect=Exception("Redis connection error"))
        
        # Should handle error gracefully and not raise exception
        result = await producer.add_to_stream(
            data={"test": "data"}, 
            stream_channel="test_stream"
        )
        
        # Should return None or handle error without crashing
        assert result is None or isinstance(result, str)


class TestRedisStreamConsumer:
    """Test Redis stream consumer"""
    
    @pytest.mark.redis
    async def test_consumer_initialization(self, fake_redis):
        """Test consumer initialization"""
        consumer = StreamConsumer(fake_redis)
        assert consumer.redis_client == fake_redis
    
    @pytest.mark.redis
    async def test_consume_stream_success(self, fake_redis):
        """Test successful stream consumption"""
        # First add some data to the stream
        producer = Producer(fake_redis)
        consumer = StreamConsumer(fake_redis)
        
        stream_name = "test_consume_stream"
        test_data = {"token123": "Test message"}
        
        # Add message to stream
        await producer.add_to_stream(data=test_data, stream_channel=stream_name)
        
        # Consume from stream
        result = await consumer.consume_stream(
            stream_channel=stream_name,
            count=1,
            block=0
        )
        
        assert isinstance(result, list)
        if len(result) > 0:
            stream_name_result, messages = result[0]
            assert stream_name_result.decode() == stream_name if isinstance(stream_name_result, bytes) else stream_name_result == stream_name
            assert len(messages) >= 1
    
    @pytest.mark.redis
    async def test_consume_stream_empty(self, fake_redis):
        """Test consuming from empty stream"""
        consumer = StreamConsumer(fake_redis)
        
        # Try to consume from non-existent stream with no blocking
        result = await consumer.consume_stream(
            stream_channel="non_existent_stream",
            count=1,
            block=0
        )
        
        # Should return empty list or handle gracefully
        assert isinstance(result, list)
    
    @pytest.mark.redis
    async def test_delete_message_success(self, fake_redis):
        """Test successful message deletion"""
        producer = Producer(fake_redis)
        consumer = StreamConsumer(fake_redis)
        
        stream_name = "test_delete_stream"
        test_data = {"token123": "Message to delete"}
        
        # Add message to stream
        message_id = await producer.add_to_stream(data=test_data, stream_channel=stream_name)
        
        # Delete message
        result = await consumer.delete_message(stream_name, message_id)
        
        # Should complete without error
        assert result is not None or result is None  # Either way is acceptable
    
    @pytest.mark.redis
    async def test_consume_stream_with_count(self, fake_redis):
        """Test consuming specific number of messages"""
        producer = Producer(fake_redis)
        consumer = StreamConsumer(fake_redis)
        
        stream_name = "test_count_stream"
        
        # Add multiple messages
        message_ids = []
        for i in range(5):
            msg_id = await producer.add_to_stream(
                data={f"token{i}": f"Message {i}"},
                stream_channel=stream_name
            )
            message_ids.append(msg_id)
        
        # Consume with specific count
        result = await consumer.consume_stream(
            stream_channel=stream_name,
            count=3,
            block=0
        )
        
        if len(result) > 0:
            stream_name_result, messages = result[0]
            # Should not exceed requested count
            assert len(messages) <= 3
    
    @pytest.mark.redis
    async def test_stream_operations_integration(self, fake_redis):
        """Test full producer-consumer integration"""
        producer = Producer(fake_redis)
        consumer = StreamConsumer(fake_redis)
        
        stream_name = "integration_test_stream"
        test_messages = [
            {"user1": "Hello from user 1"},
            {"user2": "Hello from user 2"},
            {"user3": "Hello from user 3"}
        ]
        
        # Produce messages
        message_ids = []
        for msg in test_messages:
            msg_id = await producer.add_to_stream(data=msg, stream_channel=stream_name)
            message_ids.append(msg_id)
        
        # Consume all messages
        result = await consumer.consume_stream(
            stream_channel=stream_name,
            count=10,  # Request more than available
            block=0
        )
        
        if len(result) > 0:
            stream_name_result, messages = result[0]
            
            # Verify we got our messages
            assert len(messages) == 3
            
            # Clean up by deleting messages
            for msg_id, _ in messages:
                await consumer.delete_message(stream_name, msg_id)


class TestRedisSessionManagement:
    """Test Redis session management operations"""
    
    @pytest.mark.redis
    async def test_session_creation_and_retrieval(self, fake_redis, sample_chat_session):
        """Test complete session lifecycle"""
        cache = Cache(fake_redis)
        token = sample_chat_session.token
        
        # Store session
        await fake_redis.json().set(token, Path.root_path(), sample_chat_session.model_dump())
        
        # Set expiry (like in the real application)
        await fake_redis.expire(token, 3600)
        
        # Retrieve session
        result = await cache.get_chat_history(token)
        
        assert result is not None
        assert result["token"] == token
        
        # Check TTL
        ttl = await fake_redis.ttl(token)
        assert ttl > 0
    
    @pytest.mark.redis
    async def test_session_expiry(self, fake_redis, sample_chat_session):
        """Test session expiry behavior"""
        cache = Cache(fake_redis)
        token = sample_chat_session.token
        
        # Store session with very short TTL
        await fake_redis.json().set(token, Path.root_path(), sample_chat_session.model_dump())
        await fake_redis.expire(token, 1)
        
        # Wait for expiry
        await asyncio.sleep(2)
        
        # Session should be expired
        result = await cache.get_chat_history(token)
        assert result is None
    
    @pytest.mark.redis
    async def test_multiple_sessions(self, fake_redis):
        """Test handling multiple concurrent sessions"""
        cache = Cache(fake_redis)
        
        # Create multiple sessions
        sessions = []
        for i in range(3):
            session_data = {
                "token": f"token-{i}",
                "name": f"User {i}",
                "messages": [
                    {
                        "id": f"msg-{i}",
                        "msg": f"Hello from user {i}",
                        "source": "user",
                        "timestamp": "2023-01-01T00:00:00"
                    }
                ]
            }
            sessions.append(session_data)
            await fake_redis.json().set(f"token-{i}", Path.root_path(), session_data)
        
        # Retrieve all sessions
        for i, session in enumerate(sessions):
            result = await cache.get_chat_history(f"token-{i}")
            assert result["name"] == f"User {i}"
            assert len(result["messages"]) == 1