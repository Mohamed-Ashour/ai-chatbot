"""
Test cases for Redis stream operations (src/redis/stream.py).
"""
import pytest
from unittest.mock import AsyncMock
from src.redis.stream import StreamConsumer


class TestStreamConsumer:
    """Test cases for StreamConsumer class."""
    
    @pytest.mark.asyncio

    
    async def test_stream_consumer_initialization(self, mock_redis_client):
        """Test StreamConsumer initialization."""
        consumer = StreamConsumer(mock_redis_client)
        
        assert consumer.redis_client == mock_redis_client
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_success(self, stream_consumer, sample_stream_response):
        """Test successful stream consumption."""
        stream_consumer.redis_client.xread = AsyncMock(return_value=sample_stream_response)
        
        result = await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=1,
            block=0
        )
        
        stream_consumer.redis_client.xread.assert_called_once_with(
            streams={"message_channel": '0-0'},
            count=1,
            block=0
        )
        assert result == sample_stream_response
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_empty_response(self, stream_consumer):
        """Test stream consumption with empty response."""
        stream_consumer.redis_client.xread = AsyncMock(return_value=[])
        
        result = await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=1,
            block=0
        )
        
        assert result == []
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_multiple_count(self, stream_consumer):
        """Test stream consumption with multiple message count."""
        multiple_messages_response = [
            (b'message_channel', [
                (b'1234567890123-0', {b'token1': b'Message 1'}),
                (b'1234567890124-0', {b'token2': b'Message 2'}),
                (b'1234567890125-0', {b'token3': b'Message 3'})
            ])
        ]
        stream_consumer.redis_client.xread = AsyncMock(return_value=multiple_messages_response)
        
        result = await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=3,
            block=0
        )
        
        stream_consumer.redis_client.xread.assert_called_once_with(
            streams={"message_channel": '0-0'},
            count=3,
            block=0
        )
        assert result == multiple_messages_response
        assert len(result[0][1]) == 3  # 3 messages in the response
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_blocking(self, stream_consumer):
        """Test stream consumption with blocking."""
        stream_consumer.redis_client.xread = AsyncMock(return_value=[])
        
        await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=1,
            block=5000  # Block for 5 seconds
        )
        
        stream_consumer.redis_client.xread.assert_called_once_with(
            streams={"message_channel": '0-0'},
            count=1,
            block=5000
        )
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_different_channel(self, stream_consumer):
        """Test stream consumption from different channel."""
        stream_consumer.redis_client.xread = AsyncMock(return_value=[])
        
        await stream_consumer.consume_stream(
            stream_channel="custom_channel",
            count=1,
            block=0
        )
        
        stream_consumer.redis_client.xread.assert_called_once_with(
            streams={"custom_channel": '0-0'},
            count=1,
            block=0
        )
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_exception_handling(self, stream_consumer):
        """Test exception handling in consume_stream."""
        stream_consumer.redis_client.xread = AsyncMock(side_effect=Exception("Redis connection error"))
        
        with pytest.raises(Exception, match="Redis connection error"):
            await stream_consumer.consume_stream(
                stream_channel="message_channel",
                count=1,
                block=0
            )
            
    @pytest.mark.asyncio

            
    async def test_delete_message_success(self, stream_consumer):
        """Test successful message deletion."""
        stream_consumer.redis_client.xdel = AsyncMock(return_value=1)  # 1 message deleted
        
        await stream_consumer.delete_message(
            stream_channel="message_channel",
            message_id="1234567890123-0"
        )
        
        stream_consumer.redis_client.xdel.assert_called_once_with(
            "message_channel",
            "1234567890123-0"
        )
        
    @pytest.mark.asyncio

        
    async def test_delete_message_not_found(self, stream_consumer):
        """Test deleting a message that doesn't exist."""
        stream_consumer.redis_client.xdel = AsyncMock(return_value=0)  # 0 messages deleted
        
        await stream_consumer.delete_message(
            stream_channel="message_channel",
            message_id="nonexistent-message-id"
        )
        
        stream_consumer.redis_client.xdel.assert_called_once_with(
            "message_channel",
            "nonexistent-message-id"
        )
        
    @pytest.mark.asyncio

        
    async def test_delete_message_exception_handling(self, stream_consumer):
        """Test exception handling in delete_message."""
        stream_consumer.redis_client.xdel = AsyncMock(side_effect=Exception("Redis error"))
        
        with pytest.raises(Exception, match="Redis error"):
            await stream_consumer.delete_message(
                stream_channel="message_channel",
                message_id="1234567890123-0"
            )
            
    @pytest.mark.asyncio

            
    async def test_delete_multiple_messages(self, stream_consumer):
        """Test deleting multiple messages from stream."""
        # Test that we can call delete_message multiple times
        stream_consumer.redis_client.xdel = AsyncMock(return_value=1)
        
        message_ids = ["1234567890123-0", "1234567890124-0", "1234567890125-0"]
        
        for message_id in message_ids:
            await stream_consumer.delete_message(
                stream_channel="message_channel",
                message_id=message_id
            )
        
        # Verify xdel was called for each message
        assert stream_consumer.redis_client.xdel.call_count == 3
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_with_custom_start_id(self, stream_consumer):
        """Test that consume_stream always uses '0-0' as start ID."""
        # This test verifies the current implementation behavior
        # The stream consumer always reads from the beginning ('0-0')
        stream_consumer.redis_client.xread = AsyncMock(return_value=[])
        
        await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=1,
            block=0
        )
        
        # Should always use '0-0' regardless of what might be expected
        stream_consumer.redis_client.xread.assert_called_once_with(
            streams={"message_channel": '0-0'},
            count=1,
            block=0
        )
        
    @pytest.mark.asyncio

        
    async def test_consume_stream_response_format(self, stream_consumer):
        """Test that consume_stream handles the expected Redis response format."""
        # Redis xread returns: [(stream_name, [(message_id, fields), ...])]
        expected_response = [
            (b'message_channel', [
                (b'1640995200000-0', {b'token123': b'Hello world'}),
                (b'1640995201000-0', {b'token456': b'How are you?'})
            ])
        ]
        
        stream_consumer.redis_client.xread = AsyncMock(return_value=expected_response)
        
        result = await stream_consumer.consume_stream(
            stream_channel="message_channel",
            count=2,
            block=0
        )
        
        assert result == expected_response
        assert len(result) == 1  # One stream
        assert len(result[0][1]) == 2  # Two messages
        
        # Verify structure
        stream_name, messages = result[0]
        assert stream_name == b'message_channel'
        
        message_id1, fields1 = messages[0]
        assert message_id1 == b'1640995200000-0'
        assert b'token123' in fields1
        
        message_id2, fields2 = messages[1]
        assert message_id2 == b'1640995201000-0'
        assert b'token456' in fields2