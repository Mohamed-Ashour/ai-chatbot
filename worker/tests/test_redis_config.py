"""
Test cases for Redis configuration (src/redis/config.py).
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from src.redis.config import Redis


class TestRedis:
    """Test cases for Redis configuration class."""
    
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'test_password',
        'REDIS_USER': 'test_user',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379'
    })
    def test_redis_init_with_env_vars(self):
        """Test Redis initialization with environment variables."""
        redis_config = Redis()
        
        assert redis_config.REDIS_PASSWORD == 'test_password'
        assert redis_config.REDIS_USER == 'test_user'
        assert redis_config.HOST == 'localhost'
        assert redis_config.PORT == '6379'
        assert redis_config.connection_url == 'redis://test_user:test_password@localhost:6379'
        
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'pass123',
        'REDIS_USER': 'admin',
        'REDIS_HOST': 'redis-server',
        'REDIS_PORT': '6380'
    })
    def test_redis_init_custom_values(self):
        """Test Redis initialization with custom values."""
        redis_config = Redis()
        
        assert redis_config.REDIS_PASSWORD == 'pass123'
        assert redis_config.REDIS_USER == 'admin'
        assert redis_config.HOST == 'redis-server'
        assert redis_config.PORT == '6380'
        assert redis_config.connection_url == 'redis://admin:pass123@redis-server:6380'
        
    @patch.dict(os.environ, {}, clear=True)
    def test_redis_init_missing_env_vars(self):
        """Test Redis initialization fails when environment variables are missing."""
        with pytest.raises(KeyError):
            Redis()
            
    @pytest.mark.asyncio
    @patch('redis.asyncio.from_url')
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'test_password',
        'REDIS_USER': 'test_user',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379'
    })
    async def test_create_connection(self, mock_from_url):
        """Test creating Redis connection."""
        mock_connection = MagicMock()
        mock_from_url.return_value = mock_connection
        
        redis_config = Redis()
        connection = await redis_config.create_connection()
        
        mock_from_url.assert_called_once_with(
            'redis://test_user:test_password@localhost:6379',
            db=0
        )
        assert connection == mock_connection
        assert redis_config.connection == mock_connection
        
    @pytest.mark.asyncio
    @patch('redis.asyncio.from_url')
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'test_password',
        'REDIS_USER': 'test_user',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379'
    })
    async def test_create_connection_sets_instance_variable(self, mock_from_url):
        """Test that create_connection sets the connection instance variable."""
        mock_connection = MagicMock()
        mock_from_url.return_value = mock_connection
        
        redis_config = Redis()
        
        # Initially no connection
        assert not hasattr(redis_config, 'connection')
        
        await redis_config.create_connection()
        
        # Connection should be set
        assert redis_config.connection == mock_connection
        
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'special!@#$%chars',
        'REDIS_USER': 'user@domain.com',
        'REDIS_HOST': '192.168.1.100',
        'REDIS_PORT': '6379'
    })
    def test_redis_connection_url_special_characters(self):
        """Test connection URL generation with special characters."""
        redis_config = Redis()
        
        expected_url = 'redis://user@domain.com:special!@#$%chars@192.168.1.100:6379'
        assert redis_config.connection_url == expected_url
        
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': '',
        'REDIS_USER': 'test_user',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379'
    })
    def test_redis_empty_password(self):
        """Test Redis initialization with empty password."""
        redis_config = Redis()
        
        assert redis_config.REDIS_PASSWORD == ''
        assert redis_config.connection_url == 'redis://test_user:@localhost:6379'
        
    @pytest.mark.asyncio
    @patch('redis.asyncio.from_url', side_effect=Exception("Connection failed"))
    @patch.dict(os.environ, {
        'REDIS_PASSWORD': 'test_password',
        'REDIS_USER': 'test_user',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379'
    })
    async def test_create_connection_failure(self, mock_from_url):
        """Test handling of connection creation failure."""
        redis_config = Redis()
        
        with pytest.raises(Exception, match="Connection failed"):
            await redis_config.create_connection()