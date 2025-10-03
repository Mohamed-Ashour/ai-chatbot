"""
Test cases for the schema module (src/schema/chat.py).
"""
import pytest
from datetime import datetime
import uuid
from pydantic import ValidationError
from src.schema.chat import Message, SourceEnum


class TestSourceEnum:
    """Test cases for SourceEnum."""
    
    def test_source_enum_values(self):
        """Test that SourceEnum has correct values."""
        assert SourceEnum.user == "user"
        assert SourceEnum.assistant == "assistant"
        
    def test_source_enum_string_conversion(self):
        """Test that SourceEnum can be converted to string."""
        assert SourceEnum.user.value == "user"
        assert SourceEnum.assistant.value == "assistant"


class TestMessage:
    """Test cases for Message model."""
    
    def test_message_creation_with_all_fields(self):
        """Test creating a message with all fields specified."""
        message_id = str(uuid.uuid4())
        timestamp = str(datetime.now())
        
        message = Message(
            id=message_id,
            msg="Test message",
            timestamp=timestamp,
            source=SourceEnum.user
        )
        
        assert message.id == message_id
        assert message.msg == "Test message"
        assert message.timestamp == timestamp
        assert message.source == SourceEnum.user
        
    def test_message_creation_with_defaults(self):
        """Test creating a message with default values for id and timestamp."""
        message = Message(
            msg="Test message",
            source=SourceEnum.user
        )
        
        # Check that defaults are set
        assert message.id is not None
        assert isinstance(message.id, str)
        assert message.timestamp is not None
        assert isinstance(message.timestamp, str)
        assert message.msg == "Test message"
        assert message.source == SourceEnum.user
        
    def test_message_id_is_uuid(self):
        """Test that the default ID is a valid UUID."""
        message = Message(msg="Test", source=SourceEnum.user)
        
        # Should not raise an exception
        uuid.UUID(message.id)
        
    def test_message_timestamp_format(self):
        """Test that the default timestamp is parseable."""
        message = Message(msg="Test", source=SourceEnum.user)
        
        # Should not raise an exception
        datetime.fromisoformat(message.timestamp.replace('Z', '+00:00') if message.timestamp.endswith('Z') else message.timestamp)
        
    def test_message_with_assistant_source(self):
        """Test creating a message with assistant source."""
        message = Message(
            msg="I'm here to help!",
            source=SourceEnum.assistant
        )
        
        assert message.source == SourceEnum.assistant
        assert message.msg == "I'm here to help!"
        
    def test_message_validation_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        with pytest.raises(ValidationError):
            Message()
            
        with pytest.raises(ValidationError):
            Message(msg="Test message")
            
        with pytest.raises(ValidationError):
            Message(source=SourceEnum.user)
            
    def test_message_validation_invalid_source(self):
        """Test that validation fails with invalid source."""
        with pytest.raises(ValidationError):
            Message(
                msg="Test message",
                source="invalid_source"
            )
            
    def test_message_model_dump(self):
        """Test that Message can be converted to dict."""
        message = Message(
            msg="Test message",
            source=SourceEnum.user
        )
        
        data = message.model_dump()
        
        assert isinstance(data, dict)
        assert "id" in data
        assert "msg" in data
        assert "timestamp" in data
        assert "source" in data
        assert data["msg"] == "Test message"
        assert data["source"] == "user"
        
    def test_message_from_dict(self):
        """Test creating Message from dictionary."""
        data = {
            "id": "test-id",
            "msg": "Test message",
            "timestamp": "2024-01-01T10:00:00",
            "source": "user"
        }
        
        message = Message(**data)
        
        assert message.id == "test-id"
        assert message.msg == "Test message"
        assert message.timestamp == "2024-01-01T10:00:00"
        assert message.source == SourceEnum.user
        
    def test_message_equality(self):
        """Test that messages with same data are equal."""
        message1 = Message(
            id="same-id",
            msg="Same message",
            timestamp="2024-01-01T10:00:00",
            source=SourceEnum.user
        )
        
        message2 = Message(
            id="same-id",
            msg="Same message", 
            timestamp="2024-01-01T10:00:00",
            source=SourceEnum.user
        )
        
        assert message1 == message2
        
    def test_message_inequality(self):
        """Test that messages with different data are not equal."""
        message1 = Message(
            msg="Message 1",
            source=SourceEnum.user
        )
        
        message2 = Message(
            msg="Message 2",
            source=SourceEnum.user
        )
        
        assert message1 != message2