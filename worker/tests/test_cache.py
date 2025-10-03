"""
Test cases for Redis cache operations (src/redis/cache.py).
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from redis.commands.json.path import Path
from src.redis.cache import Cache


class TestCache:
    """Test cases for Cache class."""

    @pytest.mark.asyncio


    async def test_get_chat_history_success(self, cache, sample_chat_history, sample_token):
        """Test successful retrieval of chat history."""
        cache.redis_client.json().get = AsyncMock(return_value=sample_chat_history)

        result = await cache.get_chat_history(token=sample_token, limit=10)

        cache.redis_client.json().get.assert_called_once_with(sample_token, Path.root_path())
        assert result == sample_chat_history

    @pytest.mark.asyncio


    async def test_get_chat_history_with_limit(self, cache, sample_token):
        """Test chat history retrieval with message limit."""
        # Create history with more messages than limit
        large_history = {
            "messages": [
                {"id": f"msg{i}", "msg": f"Message {i}", "timestamp": "2024-01-01T10:00:00", "source": "user"}
                for i in range(15)
            ]
        }

        cache.redis_client.json().get = AsyncMock(return_value=large_history)

        result = await cache.get_chat_history(token=sample_token, limit=5)

        # Should return only the last 5 messages
        assert len(result["messages"]) == 5
        assert result["messages"][0]["id"] == "msg10"  # Last 5 messages: 10, 11, 12, 13, 14
        assert result["messages"][-1]["id"] == "msg14"

    @pytest.mark.asyncio


    async def test_get_chat_history_empty_result(self, cache, sample_token):
        """Test chat history retrieval when no data exists."""
        cache.redis_client.json().get = AsyncMock(return_value=None)

        result = await cache.get_chat_history(token=sample_token, limit=10)

        cache.redis_client.json().get.assert_called_once_with(sample_token, Path.root_path())
        assert result is None

    @pytest.mark.asyncio


    async def test_get_chat_history_no_messages_key(self, cache, sample_token):
        """Test chat history retrieval when data has no messages key."""
        data_without_messages = {"session_id": "test", "user": "testuser"}
        cache.redis_client.json().get = AsyncMock(return_value=data_without_messages)

        result = await cache.get_chat_history(token=sample_token, limit=10)

        # Should return data as-is since there's no messages key to limit
        assert result == data_without_messages

    @pytest.mark.asyncio


    async def test_get_chat_history_messages_not_list(self, cache, sample_token):
        """Test chat history retrieval when messages is not a list."""
        invalid_data = {"messages": "not_a_list"}
        cache.redis_client.json().get = AsyncMock(return_value=invalid_data)

        result = await cache.get_chat_history(token=sample_token, limit=10)

        # Should return data as-is since messages is not a list
        assert result == invalid_data

    @pytest.mark.asyncio


    async def test_get_chat_history_limit_larger_than_messages(self, cache, sample_token):
        """Test chat history retrieval when limit is larger than available messages."""
        small_history = {
            "messages": [
                {"id": "msg1", "msg": "Message 1", "timestamp": "2024-01-01T10:00:00", "source": "user"},
                {"id": "msg2", "msg": "Message 2", "timestamp": "2024-01-01T10:00:01", "source": "assistant"}
            ]
        }

        cache.redis_client.json().get = AsyncMock(return_value=small_history)

        result = await cache.get_chat_history(token=sample_token, limit=10)

        # Should return all available messages
        assert len(result["messages"]) == 2
        assert result == small_history

    @pytest.mark.asyncio
    async def test_add_messages_to_cache_single_message(self, cache, sample_token):
        """Test adding a single message to cache."""
        message_data = {"id": "msg1", "msg": "Hello", "timestamp": "2024-01-01T10:00:00", "source": "user"}

        await cache.add_messages_to_cache(token=sample_token, messages=[message_data])

        # Verify the call was made with correct arguments (ignoring dict key order)
        cache.redis_client.json().arrappend.assert_called_once()
        args, kwargs = cache.redis_client.json().arrappend.call_args
        assert args[0] == sample_token
        assert str(args[1]) == '.messages'
        assert args[2] == message_data

    @pytest.mark.asyncio
    async def test_add_messages_to_cache_multiple_messages(self, cache, sample_token):
        """Test adding multiple messages to cache."""
        messages = [
            {"id": "msg1", "msg": "Hello", "timestamp": "2024-01-01T10:00:00", "source": "user"},
            {"id": "msg2", "msg": "Hi there!", "timestamp": "2024-01-01T10:00:01", "source": "assistant"}
        ]

        await cache.add_messages_to_cache(token=sample_token, messages=messages)

        # Verify the call was made with correct arguments
        cache.redis_client.json().arrappend.assert_called_once()
        args, kwargs = cache.redis_client.json().arrappend.call_args
        assert args[0] == sample_token
        assert str(args[1]) == '.messages'
        assert args[2:] == tuple(messages)

    @pytest.mark.asyncio
    async def test_add_messages_to_cache_empty_list(self, cache, sample_token):
        """Test adding empty message list to cache."""
        await cache.add_messages_to_cache(token=sample_token, messages=[])

        # Should still call arrappend with no messages
        cache.redis_client.json().arrappend.assert_called_once()
        args, kwargs = cache.redis_client.json().arrappend.call_args
        assert args[0] == sample_token
        assert str(args[1]) == '.messages'
        assert len(args) == 2  # No additional message arguments

    @pytest.mark.asyncio


    async def test_cache_initialization(self, mock_redis_client):
        """Test Cache class initialization."""
        cache = Cache(mock_redis_client)

        assert cache.redis_client == mock_redis_client

    @pytest.mark.asyncio


    async def test_get_chat_history_exception_handling(self, cache, sample_token):
        """Test exception handling in get_chat_history."""
        cache.redis_client.json().get = AsyncMock(side_effect=Exception("Redis error"))

        # Should propagate the exception
        with pytest.raises(Exception, match="Redis error"):
            await cache.get_chat_history(token=sample_token, limit=10)

    @pytest.mark.asyncio


    async def test_add_messages_to_cache_exception_handling(self, cache, sample_token):
        """Test exception handling in add_messages_to_cache."""
        message_data = {"id": "msg1", "msg": "Hello", "timestamp": "2024-01-01T10:00:00", "source": "user"}
        cache.redis_client.json().arrappend = AsyncMock(side_effect=Exception("Redis error"))

        # Should propagate the exception
        with pytest.raises(Exception, match="Redis error"):
            await cache.add_messages_to_cache(token=sample_token, messages=[message_data])

    @pytest.mark.asyncio
    async def test_get_chat_history_zero_limit(self, cache, sample_chat_history, sample_token):
        """Test chat history retrieval with zero limit."""
        cache.redis_client.json().get = AsyncMock(return_value=sample_chat_history)

        result = await cache.get_chat_history(token=sample_token, limit=0)

        # With limit 0, Python slice [-0:] returns the whole list (same as [0:])
        assert len(result["messages"]) == 2

    @pytest.mark.asyncio


    async def test_get_chat_history_negative_limit(self, cache, sample_chat_history, sample_token):
        """Test chat history retrieval with negative limit."""
        cache.redis_client.json().get = AsyncMock(return_value=sample_chat_history)

        result = await cache.get_chat_history(token=sample_token, limit=-1)

        # Negative slice should work as expected in Python
        assert len(result["messages"]) == 1
        assert result["messages"][0]["id"] == "msg2"  # Last message