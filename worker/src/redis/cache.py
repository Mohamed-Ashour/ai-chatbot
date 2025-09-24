from redis.commands.json.path import Path

class Cache:
    def __init__(self, redis_client):
        self.redis_client = redis_client

    async def get_chat_history(self, token: str, limit: int):
        data = await self.redis_client.json().get(token, Path.root_path())
        
        # Limit the messages array to the last 'limit' messages
        if data and 'messages' in data and isinstance(data['messages'], list):
            data['messages'] = data['messages'][-limit:]
        
        return data
    
    async def add_messages_to_cache(self, token: str, messages: list):
      await self.redis_client.json().arrappend(token, Path('.messages'), *messages)