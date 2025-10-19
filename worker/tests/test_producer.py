"""
Test cases for Redis producer operations (src/redis/producer.py).
"""

from unittest.mock import AsyncMock

import pytest
from src.redis.producer import Producer


class TestProducer:
    """Test cases for Producer class."""

    @pytest.mark.asyncio
    async def test_producer_initialization(self, mock_redis_client):
        """Test Producer initialization."""
        producer = Producer(mock_redis_client)

        assert producer.redis_client == mock_redis_client

    @pytest.mark.asyncio
    async def test_add_to_stream_success(self, producer):
        """Test successful addition of message to stream."""
        message_id = "1640995200000-0"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        data = {"message": "Hello world"}
        stream_channel = "response_channel_token123"

        result = await producer.add_to_stream(data, stream_channel)

        producer.redis_client.xadd.assert_called_once_with(
            name=stream_channel, id="*", fields=data
        )
        assert result == message_id

    @pytest.mark.asyncio
    async def test_add_to_stream_complex_data(self, producer):
        """Test adding complex data to stream."""
        message_id = "1640995200000-1"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        complex_data = {
            "message": "This is a response",
            "metadata": "additional info",
            "timestamp": "2024-01-01T10:00:00",
        }
        stream_channel = "response_channel_token456"

        result = await producer.add_to_stream(complex_data, stream_channel)

        producer.redis_client.xadd.assert_called_once_with(
            name=stream_channel, id="*", fields=complex_data
        )
        assert result == message_id

    @pytest.mark.asyncio
    async def test_add_to_stream_empty_data(self, producer):
        """Test adding empty data to stream."""
        message_id = "1640995200000-2"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        empty_data = {}
        stream_channel = "response_channel_token789"

        result = await producer.add_to_stream(empty_data, stream_channel)

        producer.redis_client.xadd.assert_called_once_with(
            name=stream_channel, id="*", fields=empty_data
        )
        assert result == message_id

    @pytest.mark.asyncio
    async def test_add_to_stream_exception_handling(self, producer, capfd):
        """Test exception handling in add_to_stream."""
        producer.redis_client.xadd = AsyncMock(
            side_effect=Exception("Redis connection error")
        )

        data = {"message": "Hello world"}
        stream_channel = "response_channel_token123"

        # Should not raise exception but return None
        result = await producer.add_to_stream(data, stream_channel)

        # Check that error was printed
        captured = capfd.readouterr()
        assert "Error sending msg to stream => Redis connection error" in captured.out

        # Should return None when exception occurs
        assert result is None

    @pytest.mark.asyncio
    async def test_add_to_stream_different_channels(self, producer):
        """Test adding messages to different stream channels."""
        message_id = "1640995200000-0"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        channels = [
            "response_channel_user1",
            "response_channel_user2",
            "custom_channel",
            "notification_channel",
        ]

        data = {"message": "Test message"}

        for channel in channels:
            result = await producer.add_to_stream(data, channel)
            assert result == message_id

        # Verify xadd was called for each channel
        assert producer.redis_client.xadd.call_count == len(channels)

        # Verify each call used the correct channel
        calls = producer.redis_client.xadd.call_args_list
        for i, call in enumerate(calls):
            assert call.kwargs["name"] == channels[i]
            assert call.kwargs["id"] == "*"
            assert call.kwargs["fields"] == data

    @pytest.mark.asyncio
    async def test_expire_success(self, producer):
        """Test successful setting of stream expiration."""
        producer.redis_client.expire = AsyncMock(return_value=True)

        stream_channel = "response_channel_token123"
        seconds = 3600

        await producer.expire(stream_channel, seconds)

        producer.redis_client.expire.assert_called_once_with(stream_channel, seconds)

    @pytest.mark.asyncio
    async def test_expire_different_durations(self, producer):
        """Test setting expiration with different durations."""
        producer.redis_client.expire = AsyncMock(return_value=True)

        test_cases = [
            ("response_channel_token1", 60),  # 1 minute
            ("response_channel_token2", 3600),  # 1 hour
            ("response_channel_token3", 86400),  # 1 day
            ("response_channel_token4", 0),  # Immediate expiration
        ]

        for stream_channel, seconds in test_cases:
            await producer.expire(stream_channel, seconds)

        # Verify all calls were made
        assert producer.redis_client.expire.call_count == len(test_cases)

        # Verify each call used correct parameters
        calls = producer.redis_client.expire.call_args_list
        for i, call in enumerate(calls):
            expected_channel, expected_seconds = test_cases[i]
            assert call.args == (expected_channel, expected_seconds)

    @pytest.mark.asyncio
    async def test_expire_exception_handling(self, producer, capfd):
        """Test exception handling in expire."""
        producer.redis_client.expire = AsyncMock(side_effect=Exception("Redis timeout"))

        stream_channel = "response_channel_token123"
        seconds = 3600

        # Should not raise exception
        await producer.expire(stream_channel, seconds)

        # Check that error was printed
        captured = capfd.readouterr()
        assert "Error setting expiration for stream => Redis timeout" in captured.out

    @pytest.mark.asyncio
    async def test_expire_key_not_exists(self, producer):
        """Test expiring a stream that doesn't exist."""
        producer.redis_client.expire = AsyncMock(
            return_value=False
        )  # Key doesn't exist

        stream_channel = "nonexistent_channel"
        seconds = 3600

        await producer.expire(stream_channel, seconds)

        producer.redis_client.expire.assert_called_once_with(stream_channel, seconds)

    @pytest.mark.asyncio
    async def test_integration_add_and_expire(self, producer):
        """Test adding message and then setting expiration."""
        message_id = "1640995200000-0"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)
        producer.redis_client.expire = AsyncMock(return_value=True)

        data = {"message": "Response message"}
        stream_channel = "response_channel_token123"
        expire_seconds = 3600

        # Add message to stream
        add_result = await producer.add_to_stream(data, stream_channel)

        # Set expiration
        await producer.expire(stream_channel, expire_seconds)

        # Verify both operations
        assert add_result == message_id
        producer.redis_client.xadd.assert_called_once_with(
            name=stream_channel, id="*", fields=data
        )
        producer.redis_client.expire.assert_called_once_with(
            stream_channel, expire_seconds
        )

    @pytest.mark.asyncio
    async def test_add_to_stream_with_print_output(self, producer, capfd):
        """Test that add_to_stream prints success message."""
        message_id = "1640995200000-0"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        data = {"message": "Hello world"}
        stream_channel = "response_channel_token123"

        await producer.add_to_stream(data, stream_channel)

        # Check print output
        captured = capfd.readouterr()
        expected_message = f"Message id {message_id} added to {stream_channel} stream"
        assert expected_message in captured.out

    @pytest.mark.asyncio
    async def test_add_to_stream_various_data_types(self, producer):
        """Test adding various data types to stream."""
        message_id = "1640995200000-0"
        producer.redis_client.xadd = AsyncMock(return_value=message_id)

        test_cases = [
            {"string_field": "text"},
            {"number_field": "123"},
            {"boolean_field": "true"},
            {"json_string": '{"nested": "value"}'},
            {"empty_string": ""},
            {"special_chars": "!@#$%^&*()"},
        ]

        stream_channel = "test_channel"

        for data in test_cases:
            result = await producer.add_to_stream(data, stream_channel)
            assert result == message_id

        # Verify all calls were made
        assert producer.redis_client.xadd.call_count == len(test_cases)
