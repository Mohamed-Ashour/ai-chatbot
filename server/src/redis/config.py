import os

import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()


class Redis:
    def __init__(self):
        """initialize  connection"""
        self.REDIS_PASSWORD = os.environ["REDIS_PASSWORD"]
        self.REDIS_USER = os.environ["REDIS_USER"]
        self.HOST = os.environ["REDIS_HOST"]
        self.PORT = os.environ["REDIS_PORT"]
        self.connection_url = (
            f"redis://{self.REDIS_USER}:{self.REDIS_PASSWORD}@{self.HOST}:{self.PORT}"
        )

    async def create_connection(self):
        self.connection = redis.from_url(self.connection_url, db=0)

        return self.connection
