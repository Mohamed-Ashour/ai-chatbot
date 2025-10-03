import pytest
import uuid
from datetime import datetime
from pydantic import ValidationError

from src.schema.chat import Chat, Message, SourceEnum


class TestSourceEnum:
    """Test the SourceEnum enumeration"""
    
    @pytest.mark.unit
    def test_source_enum_values(self):
        """Test that SourceEnum has expected values"""
        assert SourceEnum.user == "user"
        assert SourceEnum.assistant == "assistant"
    
    @pytest.mark.unit
    def test_source_enum_iteration(self):
        """Test iterating over SourceEnum values"""
        values = [source.value for source in SourceEnum]
        assert "user" in values
        assert "assistant" in values
        assert len(values) == 2


class TestMessage:
    """Test the Message model"""
    
    @pytest.mark.unit
    def test_message_creation_with_defaults(self):
        """Test message creation with default values"""
        message = Message(
            msg="Hello, world!",
            source=SourceEnum.user
        )
        
        # Check that defaults are set
        assert message.msg == "Hello, world!"
        assert message.source == SourceEnum.user
        assert message.id is not None
        assert message.timestamp is not None
        
        # Verify ID is a valid UUID
        try:
            uuid.UUID(message.id)
        except ValueError:
            pytest.fail("Default ID is not a valid UUID")
        
        # Verify timestamp is a valid datetime string
        try:
            datetime.fromisoformat(message.timestamp.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail("Default timestamp is not a valid datetime string")
    
    @pytest.mark.unit
    def test_message_creation_with_custom_values(self):
        """Test message creation with custom values"""
        custom_id = str(uuid.uuid4())
        custom_timestamp = "2023-01-01T12:00:00"
        
        message = Message(
            id=custom_id,
            msg="Custom message",
            timestamp=custom_timestamp,
            source=SourceEnum.assistant
        )
        
        assert message.id == custom_id
        assert message.msg == "Custom message"
        assert message.timestamp == custom_timestamp
        assert message.source == SourceEnum.assistant
    
    @pytest.mark.unit
    def test_message_source_validation(self):
        """Test message source validation"""
        # Valid sources
        user_message = Message(msg="User message", source=SourceEnum.user)
        assert user_message.source == SourceEnum.user
        
        assistant_message = Message(msg="Assistant message", source=SourceEnum.assistant)
        assert assistant_message.source == SourceEnum.assistant
        
        # String values should also work
        string_user = Message(msg="String user", source="user")
        assert string_user.source == SourceEnum.user
        
        string_assistant = Message(msg="String assistant", source="assistant")
        assert string_assistant.source == SourceEnum.assistant
    
    @pytest.mark.unit
    def test_message_invalid_source(self):
        """Test message creation with invalid source"""
        with pytest.raises(ValidationError) as exc_info:
            Message(msg="Invalid source", source="invalid_source")
        
        errors = exc_info.value.errors()
        assert len(errors) > 0
        assert "source" in str(errors[0])
    
    @pytest.mark.unit
    def test_message_required_fields(self):
        """Test that required fields are enforced"""
        # Missing msg
        with pytest.raises(ValidationError) as exc_info:
            Message(source=SourceEnum.user)
        
        errors = exc_info.value.errors()
        assert any("msg" in str(error) for error in errors)
        
        # Missing source
        with pytest.raises(ValidationError) as exc_info:
            Message(msg="Test message")
        
        errors = exc_info.value.errors()
        assert any("source" in str(error) for error in errors)
    
    @pytest.mark.unit
    def test_message_serialization(self):
        """Test message serialization to dict"""
        message = Message(
            msg="Test serialization",
            source=SourceEnum.user
        )
        
        data = message.model_dump()
        
        assert isinstance(data, dict)
        assert data["msg"] == "Test serialization"
        assert data["source"] == "user"
        assert "id" in data
        assert "timestamp" in data
    
    @pytest.mark.unit
    def test_message_deserialization(self):
        """Test message creation from dict"""
        data = {
            "id": str(uuid.uuid4()),
            "msg": "Test deserialization",
            "timestamp": "2023-01-01T12:00:00",
            "source": "assistant"
        }
        
        message = Message(**data)
        
        assert message.id == data["id"]
        assert message.msg == data["msg"]
        assert message.timestamp == data["timestamp"]
        assert message.source == SourceEnum.assistant
    
    @pytest.mark.unit
    def test_message_empty_string(self):
        """Test message with empty string content"""
        message = Message(msg="", source=SourceEnum.user)
        assert message.msg == ""
    
    @pytest.mark.unit
    def test_message_long_content(self):
        """Test message with very long content"""
        long_msg = "A" * 10000  # 10K characters
        message = Message(msg=long_msg, source=SourceEnum.user)
        assert message.msg == long_msg
        assert len(message.msg) == 10000


class TestChat:
    """Test the Chat model"""
    
    @pytest.mark.unit
    def test_chat_creation_with_defaults(self):
        """Test chat creation with default values"""
        chat = Chat(
            token="test-token-123",
            messages=[],
            name="Test User"
        )
        
        assert chat.token == "test-token-123"
        assert chat.name == "Test User"
        assert isinstance(chat.messages, list)
        assert len(chat.messages) == 0
        assert chat.session_start is not None
        
        # Verify session_start is a valid datetime string
        try:
            datetime.fromisoformat(chat.session_start.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail("Default session_start is not a valid datetime string")
    
    @pytest.mark.unit
    def test_chat_creation_with_messages(self):
        """Test chat creation with messages"""
        messages = [
            Message(msg="Hello", source=SourceEnum.user),
            Message(msg="Hi there!", source=SourceEnum.assistant),
            Message(msg="How are you?", source=SourceEnum.user)
        ]
        
        chat = Chat(
            token="test-token-456",
            messages=messages,
            name="Test User"
        )
        
        assert len(chat.messages) == 3
        assert all(isinstance(msg, Message) for msg in chat.messages)
        assert chat.messages[0].msg == "Hello"
        assert chat.messages[1].source == SourceEnum.assistant
        assert chat.messages[2].msg == "How are you?"
    
    @pytest.mark.unit
    def test_chat_required_fields(self):
        """Test that required fields are enforced"""
        # Missing token
        with pytest.raises(ValidationError) as exc_info:
            Chat(messages=[], name="Test User")
        
        errors = exc_info.value.errors()
        assert any("token" in str(error) for error in errors)
        
        # Missing name
        with pytest.raises(ValidationError) as exc_info:
            Chat(token="test-token", messages=[])
        
        errors = exc_info.value.errors()
        assert any("name" in str(error) for error in errors)
        
        # Missing messages
        with pytest.raises(ValidationError) as exc_info:
            Chat(token="test-token", name="Test User")
        
        errors = exc_info.value.errors()
        assert any("messages" in str(error) for error in errors)
    
    @pytest.mark.unit
    def test_chat_custom_session_start(self):
        """Test chat creation with custom session start"""
        custom_start = "2023-01-01T10:00:00"
        
        chat = Chat(
            token="test-token-789",
            messages=[],
            name="Test User",
            session_start=custom_start
        )
        
        assert chat.session_start == custom_start
    
    @pytest.mark.unit
    def test_chat_serialization(self):
        """Test chat serialization to dict"""
        messages = [
            Message(msg="Test message", source=SourceEnum.user)
        ]
        
        chat = Chat(
            token="test-token-serialization",
            messages=messages,
            name="Serialization User"
        )
        
        data = chat.model_dump()
        
        assert isinstance(data, dict)
        assert data["token"] == "test-token-serialization"
        assert data["name"] == "Serialization User"
        assert isinstance(data["messages"], list)
        assert len(data["messages"]) == 1
        assert data["messages"][0]["msg"] == "Test message"
        assert "session_start" in data
    
    @pytest.mark.unit
    def test_chat_deserialization(self):
        """Test chat creation from dict"""
        data = {
            "token": "test-deserialization-token",
            "name": "Deserialization User",
            "messages": [
                {
                    "id": str(uuid.uuid4()),
                    "msg": "Deserialized message",
                    "timestamp": "2023-01-01T12:00:00",
                    "source": "user"
                }
            ],
            "session_start": "2023-01-01T10:00:00"
        }
        
        chat = Chat(**data)
        
        assert chat.token == data["token"]
        assert chat.name == data["name"]
        assert len(chat.messages) == 1
        assert isinstance(chat.messages[0], Message)
        assert chat.messages[0].msg == "Deserialized message"
        assert chat.session_start == data["session_start"]
    
    @pytest.mark.unit
    def test_chat_empty_token(self):
        """Test chat with empty token"""
        chat = Chat(token="", messages=[], name="Test User")
        assert chat.token == ""
    
    @pytest.mark.unit
    def test_chat_empty_name(self):
        """Test chat with empty name"""
        chat = Chat(token="test-token", messages=[], name="")
        assert chat.name == ""
    
    @pytest.mark.unit
    def test_chat_large_message_list(self):
        """Test chat with many messages"""
        messages = [
            Message(msg=f"Message {i}", source=SourceEnum.user if i % 2 == 0 else SourceEnum.assistant)
            for i in range(100)
        ]
        
        chat = Chat(
            token="test-large-chat",
            messages=messages,
            name="Heavy User"
        )
        
        assert len(chat.messages) == 100
        assert all(isinstance(msg, Message) for msg in chat.messages)
        
        # Test alternating sources
        for i, msg in enumerate(chat.messages):
            expected_source = SourceEnum.user if i % 2 == 0 else SourceEnum.assistant
            assert msg.source == expected_source
    
    @pytest.mark.unit
    def test_chat_message_validation(self):
        """Test that invalid message data is rejected"""
        # Invalid message data
        invalid_message_data = [
            {
                "id": "invalid-id",
                "msg": "Valid message",
                "timestamp": "invalid-timestamp",
                "source": "invalid-source"
            }
        ]
        
        with pytest.raises(ValidationError):
            Chat(
                token="test-token",
                messages=invalid_message_data,
                name="Test User"
            )


class TestSchemaIntegration:
    """Test schema integration scenarios"""
    
    @pytest.mark.unit
    def test_complete_chat_flow(self):
        """Test complete chat conversation flow"""
        # Start with empty chat
        chat = Chat(
            token="integration-test-token",
            messages=[],
            name="Integration User"
        )
        
        assert len(chat.messages) == 0
        
        # Add user message
        user_message = Message(
            msg="Hello, AI!",
            source=SourceEnum.user
        )
        chat.messages.append(user_message)
        
        # Add assistant response
        assistant_message = Message(
            msg="Hello! How can I help you today?",
            source=SourceEnum.assistant
        )
        chat.messages.append(assistant_message)
        
        # Add another user message
        follow_up = Message(
            msg="What's the weather like?",
            source=SourceEnum.user
        )
        chat.messages.append(follow_up)
        
        # Verify the conversation
        assert len(chat.messages) == 3
        assert chat.messages[0].source == SourceEnum.user
        assert chat.messages[1].source == SourceEnum.assistant
        assert chat.messages[2].source == SourceEnum.user
        
        # Test serialization
        data = chat.model_dump()
        assert len(data["messages"]) == 3
        
        # Test deserialization
        restored_chat = Chat(**data)
        assert len(restored_chat.messages) == 3
        assert restored_chat.token == chat.token
    
    @pytest.mark.unit
    def test_json_compatibility(self):
        """Test JSON serialization compatibility"""
        import json
        
        chat = Chat(
            token="json-test-token",
            messages=[
                Message(msg="JSON test", source=SourceEnum.user)
            ],
            name="JSON User"
        )
        
        # Serialize to JSON string
        json_str = json.dumps(chat.model_dump())
        assert isinstance(json_str, str)
        
        # Deserialize from JSON
        data = json.loads(json_str)
        restored_chat = Chat(**data)
        
        assert restored_chat.token == chat.token
        assert restored_chat.name == chat.name
        assert len(restored_chat.messages) == 1