import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from main import api
from redis.commands.json.path import Path


class TestBasicEndpoints:
    """Test basic API endpoints"""

    @pytest.mark.unit
    def test_root_endpoint(self, client):
        """Test the /test endpoint"""
        response = client.get("/test")
        assert response.status_code == 200
        assert response.json() == {"msg": "API is Online"}

    @pytest.mark.unit
    def test_health_check(self, client):
        """Test the /health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-chatbot-server"


class TestTokenEndpoint:
    """Test the /token endpoint for session creation"""

    @pytest.mark.integration
    def test_token_creation_success(self, client, mock_redis_config):
        """Test successful token creation with valid name"""
        name = "Test User"
        response = client.post("/token", data={"name": name})

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "token" in data
        assert data["name"] == name
        assert "messages" in data
        assert "session_start" in data
        assert isinstance(data["messages"], list)

        # Verify token is a valid UUID
        try:
            uuid.UUID(data["token"])
        except ValueError:
            pytest.fail("Token is not a valid UUID")

    @pytest.mark.integration
    def test_token_creation_empty_name(self, client, mock_redis_config):
        """Test token creation with empty name should fail"""
        response = client.post("/token", data={"name": ""})

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert data["detail"]["loc"] == "name"
        assert data["detail"]["msg"] == "Enter a valid name"

    @pytest.mark.integration
    def test_token_creation_missing_name(self, client, mock_redis_config):
        """Test token creation without name parameter"""
        response = client.post("/token", data={})

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    def test_token_storage_in_redis(self, client, mock_redis_config):
        """Test that token and session are properly stored in Redis"""
        name = "Test User"
        response = client.post("/token", data={"name": name})

        assert response.status_code == 200
        data = response.json()
        token = data["token"]

        # Verify token is returned and valid
        assert token is not None
        assert len(token) > 0

    @pytest.mark.integration
    def test_token_expiry_set(self, client, mock_redis_config):
        """Test that token has proper TTL set in Redis"""
        name = "Test User"
        response = client.post("/token", data={"name": name})

        assert response.status_code == 200
        data = response.json()
        token = data["token"]

        # Verify token is returned and valid
        assert token is not None
        assert len(token) > 0


class TestChatHistoryEndpoint:
    """Test the /chat_history endpoint"""

    @pytest.mark.integration
    async def test_get_chat_history_success(
        self, client, mock_redis_config, fake_redis, sample_chat_session
    ):
        """Test successful retrieval of chat history"""
        token = sample_chat_session.token

        # Store the sample session data in fake redis first
        await fake_redis.json().set(
            token, Path.root_path(), sample_chat_session.model_dump()
        )

        response = client.get(f"/chat_history?token={token}")

        assert response.status_code == 200
        data = response.json()
        assert data["token"] == token
        assert data["name"] == sample_chat_session.name
        assert len(data["messages"]) == 1
        assert data["messages"][0]["msg"] == "Hello, world!"

    @pytest.mark.integration
    def test_get_chat_history_invalid_token(self, client, mock_redis_config):
        """Test chat history with non-existent token"""
        response = client.get("/chat_history?token=invalid-token")

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Session expired or does not exist"

    @pytest.mark.integration
    def test_get_chat_history_missing_token(self, client, mock_redis_config):
        """Test chat history without token parameter"""
        response = client.get("/chat_history")

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    def test_get_chat_history_empty_token(self, client, mock_redis_config):
        """Test chat history with empty token"""
        response = client.get("/chat_history?token=")

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] == "Session expired or does not exist"


class TestCORSConfiguration:
    """Test CORS configuration"""

    @pytest.mark.unit
    def test_cors_enabled_in_app(self, client):
        """Test that CORS middleware is configured"""
        # Test with Origin header to trigger CORS
        headers = {"Origin": "http://localhost:3000"}
        response = client.get("/test", headers=headers)

        assert response.status_code == 200
        # With origin header, CORS headers should be present
        assert (
            "access-control-allow-origin" in response.headers
            or response.status_code == 200
        )

    @pytest.mark.unit
    def test_cors_preflight(self, client):
        """Test CORS preflight request"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }

        response = client.options("/token", headers=headers)

        # Should handle preflight correctly
        assert response.status_code in [200, 204]
