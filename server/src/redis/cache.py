from redis.commands.json.path import Path


class Cache:
    def __init__(self, redis_client):
        self.redis_client = redis_client

    async def get_chat_history(self, token: str):
        data = await self.redis_client.json().get(token, Path.root_path())

        return data
