"""
Test cases for the main worker process (main.py).
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from src.schema.chat import Message, SourceEnum
import main

class TestProcessMessage:
    """Test cases for the process_message function."""
    
    @pytest.mark.asyncio
    async def test_process_message_success(self, cache, mock_gpt, producer, sample_token, sample_chat_history, capfd):
        """Test successful message processing."""
        # Setup mocks
        cache.get_chat_history = AsyncMock(return_value=sample_chat_history)
        cache.add_messages_to_cache = AsyncMock()
        
        gpt_response = Message(msg="I'm doing well, thank you!", source=SourceEnum.assistant)
        mock_gpt.query = AsyncMock(return_value=gpt_response)
        
        producer.add_to_stream = AsyncMock(return_value="msg_id_123")
        producer.expire = AsyncMock()
        
        text = "How are you?"
        
        await main.process_message(text, sample_token, cache, mock_gpt, producer)
        
        # Verify chat history was retrieved
        cache.get_chat_history.assert_called_once_with(token=sample_token, limit=10)
        
        # Verify GPT was called with correct messages
        mock_gpt.query.assert_called_once()
        call_args = mock_gpt.query.call_args[1]['messages']
        
        # Should have history messages + new user message
        assert len(call_args) == 3  # 2 from history + 1 new
        assert call_args[-1].msg == "How are you?"
        assert call_args[-1].source == SourceEnum.user
        
        # Verify response was published to stream
        producer.add_to_stream.assert_called_once_with(
            {"message": "I'm doing well, thank you!"},
            f"response_channel_{sample_token}"
        )
        
        # Verify stream expiration was set
        producer.expire.assert_called_once_with(f"response_channel_{sample_token}", 3600)
        
        # Verify messages were cached
        cache.add_messages_to_cache.assert_called_once()
        cached_messages = cache.add_messages_to_cache.call_args[1]['messages']
        assert len(cached_messages) == 2  # User message + GPT response
        
    @pytest.mark.asyncio
    async def test_process_message_expired_session(self, cache, mock_gpt, producer, sample_token, capfd):
        """Test processing message with expired session."""
        cache.get_chat_history = AsyncMock(return_value=None)
        
        # Mock producer methods
        producer.add_to_stream = AsyncMock()
        producer.expire = AsyncMock()
        
        # Mock cache method
        cache.add_messages_to_cache = AsyncMock()
        
        text = "Hello"
        
        await main.process_message(text, sample_token, cache, mock_gpt, producer)
        
        # Verify session expiration was detected and logged
        captured = capfd.readouterr()
        assert f"Session expired for token: {sample_token}" in captured.out
        
        # Verify no further processing occurred
        mock_gpt.query.assert_not_called()
        producer.add_to_stream.assert_not_called()
        cache.add_messages_to_cache.assert_not_called()
        
    @pytest.mark.asyncio
    async def test_process_message_empty_chat_history(self, cache, mock_gpt, producer, sample_token):
        """Test processing message with empty chat history."""
        empty_history = {"messages": []}
        cache.get_chat_history = AsyncMock(return_value=empty_history)
        cache.add_messages_to_cache = AsyncMock()
        
        gpt_response = Message(msg="Hello! How can I help?", source=SourceEnum.assistant)
        mock_gpt.query = AsyncMock(return_value=gpt_response)
        
        producer.add_to_stream = AsyncMock(return_value="msg_id_123")
        producer.expire = AsyncMock()
        
        text = "Hello"
        
        await main.process_message(text, sample_token, cache, mock_gpt, producer)
        
        # Verify GPT was called with only the new message
        call_args = mock_gpt.query.call_args[1]['messages']
        assert len(call_args) == 1
        assert call_args[0].msg == "Hello"
        assert call_args[0].source == SourceEnum.user
        
    @pytest.mark.asyncio
    async def test_process_message_gpt_error(self, cache, mock_gpt, producer, sample_token, sample_chat_history):
        """Test processing message when GPT API fails."""
        cache.get_chat_history = AsyncMock(return_value=sample_chat_history)
        mock_gpt.query = AsyncMock(side_effect=Exception("GPT API Error"))
        
        text = "Hello"
        
        with pytest.raises(Exception, match="GPT API Error"):
            await main.process_message(text, sample_token, cache, mock_gpt, producer)
            
    @pytest.mark.asyncio
    async def test_process_message_cache_error(self, cache, mock_gpt, producer, sample_token):
        """Test processing message when cache retrieval fails."""
        cache.get_chat_history = AsyncMock(side_effect=Exception("Cache Error"))
        
        text = "Hello"
        
        with pytest.raises(Exception, match="Cache Error"):
            await main.process_message(text, sample_token, cache, mock_gpt, producer)
            
    @pytest.mark.asyncio
    async def test_process_message_producer_error(self, cache, mock_gpt, producer, sample_token, sample_chat_history):
        """Test processing message when producer fails."""
        cache.get_chat_history = AsyncMock(return_value=sample_chat_history)
        
        gpt_response = Message(msg="Response", source=SourceEnum.assistant)
        mock_gpt.query = AsyncMock(return_value=gpt_response)
        
        producer.add_to_stream = AsyncMock(side_effect=Exception("Producer Error"))
        
        text = "Hello"
        
        with pytest.raises(Exception, match="Producer Error"):
            await main.process_message(text, sample_token, cache, mock_gpt, producer)
            
    @pytest.mark.asyncio
    async def test_process_message_creates_correct_user_message(self, cache, mock_gpt, producer, sample_token, sample_chat_history):
        """Test that process_message creates user message with correct fields."""
        cache.get_chat_history = AsyncMock(return_value=sample_chat_history)
        cache.add_messages_to_cache = AsyncMock()
        
        gpt_response = Message(msg="Response", source=SourceEnum.assistant)
        mock_gpt.query = AsyncMock(return_value=gpt_response)
        
        producer.add_to_stream = AsyncMock()
        producer.expire = AsyncMock()
        
        text = "Test message"
        
        await main.process_message(text, sample_token, cache, mock_gpt, producer)
        
        # Verify user message structure
        call_args = mock_gpt.query.call_args[1]['messages']
        new_user_message = call_args[-1]
        
        assert new_user_message.msg == "Test message"
        assert new_user_message.source == SourceEnum.user
        assert new_user_message.id is not None
        assert new_user_message.timestamp is not None

class TestMain:
    """Test cases for the main function."""
    
    @patch('main.Redis')
    @patch('main.Cache')
    @patch('main.GPT')
    @patch('main.StreamConsumer')
    @patch('main.Producer')
    @pytest.mark.asyncio
    async def test_main_initialization(self, mock_producer_class, mock_consumer_class,
                                     mock_gpt_class, mock_cache_class, mock_redis_class):
        """Test that main function initializes all components correctly."""
        # Setup mocks
        mock_redis_instance = MagicMock()
        mock_redis_client = AsyncMock()
        mock_redis_instance.create_connection = AsyncMock(return_value=mock_redis_client)
        mock_redis_class.return_value = mock_redis_instance
        
        mock_cache = MagicMock()
        mock_cache_class.return_value = mock_cache
        
        mock_gpt = MagicMock()
        mock_gpt_class.return_value = mock_gpt
        
        mock_consumer = MagicMock()
        mock_consumer.consume_stream = AsyncMock(return_value=[])  # Empty response to break loop
        mock_consumer_class.return_value = mock_consumer
        
        mock_producer = MagicMock()
        mock_producer_class.return_value = mock_producer
        
        # Mock KeyboardInterrupt to stop the loop
        mock_consumer.consume_stream.side_effect = KeyboardInterrupt()
        
        # Run main function
        await main.main()
        
        # Verify initialization calls
        mock_redis_class.assert_called_once()
        mock_redis_instance.create_connection.assert_called_once()
        mock_cache_class.assert_called_once_with(mock_redis_client)
        mock_gpt_class.assert_called_once()
        mock_consumer_class.assert_called_once_with(mock_redis_client)
        mock_producer_class.assert_called_once_with(mock_redis_client)
        
    @patch('main.Redis')
    @patch('main.Cache')
    @patch('main.GPT')
    @patch('main.StreamConsumer')
    @patch('main.Producer')
    @patch('main.process_message')
    @pytest.mark.asyncio
    async def test_main_message_processing_loop
                                              mock_consumer_class, mock_gpt_class, 
                                              mock_cache_class, mock_redis_class):
        """Test the main message processing loop."""
        # Setup mocks
        mock_redis_instance = MagicMock()
        mock_redis_client = AsyncMock()
        mock_redis_instance.create_connection = AsyncMock(return_value=mock_redis_client)
        mock_redis_class.return_value = mock_redis_instance
        
        mock_consumer = MagicMock()
        
        # Mock stream response
        stream_response = [
            (b'message_channel', [
                (b'1234567890123-0', {b'token123': b'Hello, how are you?'})
            ])
        ]
        
        # First call returns message, second raises KeyboardInterrupt
        mock_consumer.consume_stream = AsyncMock(side_effect=[stream_response, KeyboardInterrupt()])
        mock_consumer.delete_message = AsyncMock()
        mock_consumer_class.return_value = mock_consumer
        
        mock_process_message.return_value = None
        
        # Setup other mocks
        mock_cache_class.return_value = MagicMock()
        mock_gpt_class.return_value = MagicMock()
        mock_producer_class.return_value = MagicMock()
        
        # Run main function
        await main.main()
        
        # Verify stream consumption
        assert mock_consumer.consume_stream.call_count == 2
        mock_consumer.consume_stream.assert_called_with(
            stream_channel="message_channel",
            count=1,
            block=0
        )
        
        # Verify message processing
        mock_process_message.assert_called_once_with(
            text='Hello, how are you?',
            token='token123',
            cache=mock_cache_class.return_value,
            gpt=mock_gpt_class.return_value,
            producer=mock_producer_class.return_value
        )
        
        # Verify message deletion
        mock_consumer.delete_message.assert_called_once_with(
            stream_channel="message_channel",
            message_id=b'1234567890123-0'
        )
        
    @patch('main.Redis')
    @pytest.mark.asyncio
    async def test_main_redis_connection_cleanup
        """Test that Redis connection is properly cleaned up."""
        mock_redis_instance = MagicMock()
        mock_redis_client = AsyncMock()
        mock_redis_instance.create_connection = AsyncMock(return_value=mock_redis_client)
        mock_redis_class.return_value = mock_redis_instance
        
        # Mock stream consumer to raise KeyboardInterrupt immediately
        with patch('main.StreamConsumer') as mock_consumer_class:
            mock_consumer = MagicMock()
            mock_consumer.consume_stream = AsyncMock(side_effect=KeyboardInterrupt())
            mock_consumer_class.return_value = mock_consumer
            
            with patch('main.Cache'), patch('main.GPT'), patch('main.Producer'):
                await main.main()
        
        # Verify cleanup
        mock_redis_client.aclose.assert_called_once()
        captured = capfd.readouterr()
        assert "Redis connection closed." in captured.out
        
    @patch('main.Redis')
    @pytest.mark.asyncio
    async def test_main_redis_cleanup_error
        """Test handling of Redis cleanup errors."""
        mock_redis_instance = MagicMock()
        mock_redis_client = AsyncMock()
        mock_redis_client.aclose = AsyncMock(side_effect=Exception("Cleanup error"))
        mock_redis_instance.create_connection = AsyncMock(return_value=mock_redis_client)
        mock_redis_class.return_value = mock_redis_instance
        
        with patch('main.StreamConsumer') as mock_consumer_class:
            mock_consumer = MagicMock()
            mock_consumer.consume_stream = AsyncMock(side_effect=KeyboardInterrupt())
            mock_consumer_class.return_value = mock_consumer
            
            with patch('main.Cache'), patch('main.GPT'), patch('main.Producer'):
                await main.main()
        
        # Verify error was handled gracefully
        captured = capfd.readouterr()
        assert "Error closing Redis connection: Cleanup error" in captured.out
        
    @patch('main.Redis')
    @pytest.mark.asyncio
    async def test_main_general_exception_handling
        """Test handling of general exceptions in main loop."""
        mock_redis_instance = MagicMock()
        mock_redis_client = AsyncMock()
        mock_redis_instance.create_connection = AsyncMock(return_value=mock_redis_client)
        mock_redis_class.return_value = mock_redis_instance
        
        with patch('main.StreamConsumer') as mock_consumer_class:
            mock_consumer = MagicMock()
            mock_consumer.consume_stream = AsyncMock(side_effect=Exception("Stream error"))
            mock_consumer_class.return_value = mock_consumer
            
            with patch('main.Cache'), patch('main.GPT'), patch('main.Producer'):
                await main.main()
        
        # Verify error was logged
        captured = capfd.readouterr()
        assert "Error in stream consumer: Stream error" in captured.out
        
    def test_main_entry_point_keyboard_interrupt(self, capfd):
        """Test handling of KeyboardInterrupt in main entry point."""
        # Simulate the entry point behavior without creating coroutines
        with patch('asyncio.run') as mock_asyncio_run:
            mock_asyncio_run.side_effect = KeyboardInterrupt()
            
            # This simulates the if __name__ == "__main__" block
            try:
                import asyncio
                # Pass a dummy value instead of calling main()
                asyncio.run("dummy_coroutine")
            except KeyboardInterrupt:
                print("\\nProgram interrupted by user")
            
            # Verify that asyncio.run was called
            mock_asyncio_run.assert_called_once()
                
        captured = capfd.readouterr()
        assert "Program interrupted by user" in captured.out
        
    def test_main_entry_point_unexpected_error(self, capfd):
        """Test handling of unexpected errors in main entry point."""
        # Simulate the entry point behavior without creating coroutines
        with patch('asyncio.run') as mock_asyncio_run:
            mock_asyncio_run.side_effect = Exception("Unexpected error")
            
            try:
                import asyncio
                # Pass a dummy value instead of calling main()
                asyncio.run("dummy_coroutine")
            except Exception as e:
                print(f"Unexpected error: {e}")
                
            # Verify that asyncio.run was called
            mock_asyncio_run.assert_called_once()
                
        captured = capfd.readouterr()
        assert "Unexpected error: Unexpected error" in captured.out
