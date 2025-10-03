"""
Test cases for GPT model integration (src/model/gpt.py).
"""
import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch
from groq import AsyncGroq
from src.model.gpt import GPT
from src.schema.chat import Message, SourceEnum


class TestGPT:
    """Test cases for GPT class."""
    
    @patch.dict(os.environ, {'GROQ_API_KEY': 'test_api_key'})
    @patch('src.model.gpt.AsyncGroq')
    def test_gpt_initialization(self, mock_groq_class):
        """Test GPT initialization with API key."""
        mock_client = MagicMock()
        mock_groq_class.return_value = mock_client
        
        gpt = GPT()
        
        mock_groq_class.assert_called_once_with(api_key='test_api_key')
        assert gpt.client == mock_client
        
    @patch.dict(os.environ, {}, clear=True)
    @patch('src.model.gpt.AsyncGroq')
    def test_gpt_initialization_no_api_key(self, mock_groq_class):
        """Test GPT initialization without API key."""
        mock_client = MagicMock()
        mock_groq_class.return_value = mock_client
        
        gpt = GPT()
        
        # Should be called with None when env var is missing
        mock_groq_class.assert_called_once_with(api_key=None)
        
    @pytest.mark.asyncio
    @patch.dict(os.environ, {'GROQ_API_KEY': 'test_key'})
    @patch('src.model.gpt.AsyncGroq')
    async def test_query_single_message(self, mock_groq_class):
        """Test querying GPT with a single message."""
        messages = [Message(msg="Hello", source=SourceEnum.user)]
        
        # Mock the GPT response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Hello! How can I help you today?"
        mock_response.model_dump.return_value = {
            "choices": [{"message": {"content": "Hello! How can I help you today?"}}]
        }
        
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_groq_class.return_value = mock_client
        
        gpt = GPT()
        result = await gpt.query(messages)
        
        # Verify the API call
        mock_client.chat.completions.create.assert_called_once_with(
            messages=[{"role": "user", "content": "Hello"}],
            model="openai/gpt-oss-20b",
            stream=False,
            max_completion_tokens=512
        )
        
        # Verify the result
        assert isinstance(result, Message)
        assert result.msg == "Hello! How can I help you today?"
        assert result.source == "assistant"
        
    @pytest.mark.asyncio
    @patch.dict(os.environ, {'GROQ_API_KEY': 'test_key'})
    @patch('src.model.gpt.AsyncGroq')
    async def test_query_multiple_messages(self, mock_groq_class):
        """Test querying GPT with multiple messages."""
        messages = [
            Message(msg="Hello", source=SourceEnum.user),
            Message(msg="Hi there! How can I help?", source=SourceEnum.assistant),
            Message(msg="What's the weather like?", source=SourceEnum.user)
        ]
        
        # Mock the GPT response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "I don't have access to real-time weather data."
        mock_response.model_dump.return_value = {"choices": [{"message": {"content": "I don't have access to real-time weather data."}}]}
        
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_groq_class.return_value = mock_client
        
        gpt = GPT()
        result = await gpt.query(messages)
        
        # Verify the API call with conversation history
        expected_api_messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there! How can I help?"},
            {"role": "user", "content": "What's the weather like?"}
        ]
        
        mock_client.chat.completions.create.assert_called_once_with(
            messages=expected_api_messages,
            model="openai/gpt-oss-20b",
            stream=False,
            max_completion_tokens=512
        )
        
        assert result.msg == "I don't have access to real-time weather data."
        assert result.source == "assistant"
        
    @pytest.mark.asyncio
    @patch.dict(os.environ, {'GROQ_API_KEY': 'test_key'})
    @patch('src.model.gpt.AsyncGroq')
    async def test_query_api_exception(self, mock_groq_class):
        """Test handling of API exceptions."""
        messages = [Message(msg="Hello", source=SourceEnum.user)]
        
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        mock_groq_class.return_value = mock_client
        
        gpt = GPT()
        
        with pytest.raises(Exception, match="API Error"):
            await gpt.query(messages)