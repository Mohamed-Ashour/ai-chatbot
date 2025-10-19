"""
Integration tests for the worker component.

These tests verify that all components work together correctly
without using external dependencies (Redis, Groq API).
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import main
import pytest
from src.model.gpt import GPT
from src.redis.cache import Cache
from src.redis.config import Redis
from src.redis.producer import Producer
from src.redis.stream import StreamConsumer

# Schema imports removed as they are not used in this test file


class TestWorkerIntegration:
    """Integration tests for the worker system."""

    @patch.dict(
        "os.environ",
        {
            "REDIS_PASSWORD": "test_pass",
            "REDIS_USER": "test_user",
            "REDIS_HOST": "localhost",
            "REDIS_PORT": "6379",
            "GROQ_API_KEY": "test_groq_key",
        },
    )
    @pytest.mark.asyncio
    async def test_end_to_end_message_processing(self):
        """Test complete message processing flow from stream to response."""
        # Mock Redis client
        mock_redis_client = AsyncMock()

        # Setup cache mocks
        chat_history = {
            "messages": [
                {
                    "id": "msg1",
                    "msg": "Previous message",
                    "timestamp": "2024-01-01T10:00:00",
                    "source": "user",
                },
                {
                    "id": "msg2",
                    "msg": "Previous response",
                    "timestamp": "2024-01-01T10:00:01",
                    "source": "assistant",
                },
            ]
        }

        # Create a proper mock for json() that returns an object with async methods
        json_mock = MagicMock()
        json_mock.get = AsyncMock(return_value=chat_history)
        json_mock.arrappend = AsyncMock()
        mock_redis_client.json = MagicMock(return_value=json_mock)

        # Setup stream consumer mocks
        stream_response = [
            (
                b"message_channel",
                [(b"1234567890123-0", {b"test_token": b"Hello, how are you?"})],
            )
        ]
        mock_redis_client.xread = AsyncMock(return_value=stream_response)
        mock_redis_client.xdel = AsyncMock()

        # Setup producer mocks
        mock_redis_client.xadd = AsyncMock(return_value="response_msg_id")
        mock_redis_client.expire = AsyncMock(return_value=True)

        # Mock GPT response
        with patch("src.model.gpt.AsyncGroq") as mock_groq:
            mock_gpt_response = MagicMock()
            mock_gpt_response.choices = [MagicMock()]
            mock_gpt_response.choices[0].message.content = (
                "I'm doing well, thank you for asking!"
            )
            mock_gpt_response.model_dump.return_value = {"test": "response"}

            mock_groq_client = AsyncMock()
            mock_groq_client.chat.completions.create = AsyncMock(
                return_value=mock_gpt_response
            )
            mock_groq.return_value = mock_groq_client

            # Create components
            with patch("redis.asyncio.from_url", return_value=mock_redis_client):
                redis_config = Redis()
                redis_client = await redis_config.create_connection()

                cache = Cache(redis_client)
                _ = StreamConsumer(redis_client)  # noqa: F841
                producer = Producer(redis_client)
                gpt = GPT()

                # Process the message
                await main.process_message(
                    text="Hello, how are you?",
                    token="test_token",
                    cache=cache,
                    gpt=gpt,
                    producer=producer,
                )

                # Verify chat history was retrieved
                mock_redis_client.json().get.assert_called_once_with(
                    "test_token", cache.redis_client.json().get.call_args[0][1]
                )

                # Verify GPT was called with correct messages
                mock_groq_client.chat.completions.create.assert_called_once()
                call_args = mock_groq_client.chat.completions.create.call_args
                api_messages = call_args.kwargs["messages"]

                # Should have: 2 history messages + 1 new user message = 3 total
                assert len(api_messages) == 3
                assert api_messages[-1]["content"] == "Hello, how are you?"
                assert api_messages[-1]["role"] == "user"

                # Verify response was published
                mock_redis_client.xadd.assert_called_once_with(
                    name="response_channel_test_token",
                    id="*",
                    fields={"message": "I'm doing well, thank you for asking!"},
                )

                # Verify expiration was set
                mock_redis_client.expire.assert_called_once_with(
                    "response_channel_test_token", 3600
                )

                # Verify messages were cached
                mock_redis_client.json().arrappend.assert_called_once()

    @patch.dict(
        "os.environ",
        {
            "REDIS_PASSWORD": "test_pass",
            "REDIS_USER": "test_user",
            "REDIS_HOST": "localhost",
            "REDIS_PORT": "6379",
            "GROQ_API_KEY": "test_groq_key",
        },
    )
    @pytest.mark.asyncio
    async def test_session_expiration_handling(self):
        """Test handling of expired sessions."""
        # Mock Redis client with expired session
        mock_redis_client = AsyncMock()

        # Create a proper mock for json() that returns an object with async methods
        json_mock = MagicMock()
        json_mock.get = AsyncMock(return_value=None)  # Expired session
        mock_redis_client.json = MagicMock(return_value=json_mock)

        with patch("redis.asyncio.from_url", return_value=mock_redis_client):
            with patch("src.model.gpt.AsyncGroq"):
                redis_config = Redis()
                redis_client = await redis_config.create_connection()

                cache = Cache(redis_client)
                producer = Producer(redis_client)
                gpt = GPT()

                # Process message with expired session
                await main.process_message(
                    text="Hello",
                    token="expired_token",
                    cache=cache,
                    gpt=gpt,
                    producer=producer,
                )

                # Verify session check was made
                mock_redis_client.json().get.assert_called_once()

                # Verify no further processing occurred
                mock_redis_client.xadd.assert_not_called()
                mock_redis_client.json().arrappend.assert_not_called()

    @pytest.mark.asyncio
    async def test_message_parsing_from_stream(self):
        """Test parsing message data from Redis stream format."""
        # Simulate Redis stream response format
        stream_data = [
            (
                b"message_channel",
                [
                    (b"1640995200000-0", {b"user123": b"What is Python?"}),
                    (b"1640995201000-0", {b"user456": b"How does Redis work?"}),
                ],
            )
        ]

        # Extract messages like main.py does
        messages = []
        for stream, stream_messages in stream_data:
            for message_id, message_data in stream_messages:
                # Parse the key-value pair (token, text)
                token, text = [
                    (k.decode("utf-8"), v.decode("utf-8"))
                    for k, v in message_data.items()
                ][0]
                messages.append(
                    {"message_id": message_id, "token": token, "text": text}
                )

        # Verify parsing
        assert len(messages) == 2

        assert messages[0]["message_id"] == b"1640995200000-0"
        assert messages[0]["token"] == "user123"
        assert messages[0]["text"] == "What is Python?"

        assert messages[1]["message_id"] == b"1640995201000-0"
        assert messages[1]["token"] == "user456"
        assert messages[1]["text"] == "How does Redis work?"

    @pytest.mark.asyncio
    async def test_error_propagation_through_stack(self):
        """Test that errors propagate correctly through the component stack."""
        mock_redis_client = AsyncMock()

        # Test cache error propagation
        json_mock = MagicMock()
        json_mock.get = AsyncMock(side_effect=Exception("Redis connection lost"))
        mock_redis_client.json = MagicMock(return_value=json_mock)

        with patch("redis.asyncio.from_url", return_value=mock_redis_client):
            with patch("src.model.gpt.AsyncGroq"):
                redis_config = Redis()
                redis_client = await redis_config.create_connection()

                cache = Cache(redis_client)
                producer = Producer(redis_client)
                gpt = GPT()

                # Error should propagate up
                with pytest.raises(Exception, match="Redis connection lost"):
                    await main.process_message(
                        text="Hello",
                        token="test_token",
                        cache=cache,
                        gpt=gpt,
                        producer=producer,
                    )

    @pytest.mark.asyncio
    async def test_component_initialization_order(self):
        """Test that components are initialized in the correct order."""
        initialization_order = []

        # Track initialization calls
        original_redis_init = Redis.__init__
        original_cache_init = Cache.__init__
        original_gpt_init = GPT.__init__
        original_consumer_init = StreamConsumer.__init__
        original_producer_init = Producer.__init__

        def track_redis_init(self):
            initialization_order.append("Redis")
            original_redis_init(self)

        def track_cache_init(self, redis_client):
            initialization_order.append("Cache")
            original_cache_init(self, redis_client)

        def track_gpt_init(self):
            initialization_order.append("GPT")
            original_gpt_init(self)

        def track_consumer_init(self, redis_client):
            initialization_order.append("StreamConsumer")
            original_consumer_init(self, redis_client)

        def track_producer_init(self, redis_client):
            initialization_order.append("Producer")
            original_producer_init(self, redis_client)

        with patch.dict(
            "os.environ",
            {
                "REDIS_PASSWORD": "test_pass",
                "REDIS_USER": "test_user",
                "REDIS_HOST": "localhost",
                "REDIS_PORT": "6379",
                "GROQ_API_KEY": "test_groq_key",
            },
        ):
            with patch.object(Redis, "__init__", track_redis_init):
                with patch.object(Cache, "__init__", track_cache_init):
                    with patch.object(GPT, "__init__", track_gpt_init):
                        with patch.object(
                            StreamConsumer, "__init__", track_consumer_init
                        ):
                            with patch.object(
                                Producer, "__init__", track_producer_init
                            ):
                                with patch("redis.asyncio.from_url"):
                                    with patch("src.model.gpt.AsyncGroq"):
                                        # Simulate main initialization sequence
                                        redis = Redis()
                                        redis_client = await redis.create_connection()
                        _ = Cache(redis_client)  # noqa: F841
                        _ = GPT()  # noqa: F841
                        _ = StreamConsumer(redis_client)  # noqa: F841
                        _ = Producer(redis_client)  # noqa: F841

        # Verify correct initialization order
        expected_order = ["Redis", "Cache", "GPT", "StreamConsumer", "Producer"]
        assert initialization_order == expected_order

    @pytest.mark.asyncio
    async def test_concurrent_message_processing(self):
        """Test that the system can handle concurrent message processing logic."""
        # This tests the async nature of the system
        mock_redis_client = AsyncMock()

        # Setup mocks for successful processing
        chat_history = {"messages": []}

        # Create a proper mock for json() that returns an object with async methods
        json_mock = MagicMock()
        json_mock.get = AsyncMock(return_value=chat_history)
        json_mock.arrappend = AsyncMock()
        mock_redis_client.json = MagicMock(return_value=json_mock)
        mock_redis_client.xadd = AsyncMock(return_value="msg_id")
        mock_redis_client.expire = AsyncMock(return_value=True)

        with patch("redis.asyncio.from_url", return_value=mock_redis_client):
            with patch("src.model.gpt.AsyncGroq") as mock_groq:
                # Mock GPT responses
                mock_response1 = MagicMock()
                mock_response1.choices = [MagicMock()]
                mock_response1.choices[0].message.content = "Response 1"
                mock_response1.model_dump.return_value = {}

                mock_response2 = MagicMock()
                mock_response2.choices = [MagicMock()]
                mock_response2.choices[0].message.content = "Response 2"
                mock_response2.model_dump.return_value = {}

                mock_groq_client = AsyncMock()
                mock_groq_client.chat.completions.create = AsyncMock(
                    side_effect=[mock_response1, mock_response2]
                )
                mock_groq.return_value = mock_groq_client

                # Initialize components
                redis_config = Redis()
                redis_client = await redis_config.create_connection()

                cache = Cache(redis_client)
                producer = Producer(redis_client)
                gpt = GPT()

                # Process multiple messages concurrently
                tasks = [
                    main.process_message("Message 1", "token1", cache, gpt, producer),
                    main.process_message("Message 2", "token2", cache, gpt, producer),
                ]

                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Both should complete successfully
                assert all(result is None for result in results)

                # Verify both messages were processed
                assert mock_groq_client.chat.completions.create.call_count == 2
                assert mock_redis_client.xadd.call_count == 2
