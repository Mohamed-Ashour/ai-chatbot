from typing import Optional

from fastapi import Query, WebSocket, WebSocketException, status

from ..redis.config import Redis

redis = Redis()


async def get_token(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    if token is None or token == "":
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Token is required"
        )

    redis_client = await redis.create_connection()
    isExists = await redis_client.exists(token)

    if isExists == 1:
        return token
    else:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Session not authenticated or expired token",
        )
