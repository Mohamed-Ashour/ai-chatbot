from fastapi import APIRouter, WebSocket, Request, HTTPException, WebSocketDisconnect, Depends, Form
from redis.commands.json.path import Path
import uuid

from src.redis.producer import Producer
from src.redis.stream import StreamConsumer
from src.redis.config import Redis
from src.redis.cache import Cache
from src.socket.connection import ConnectionManager
from src.socket.utils import get_token
from src.schema.chat import Chat


manager = ConnectionManager()
redis = Redis()

chat = APIRouter()

# @route   POST /token
# @desc    Route to generate chat token
# @access  Public

@chat.post("/token")
async def token_generator(name: str = Form()):
    if name == "":
        raise HTTPException(status_code=400, detail={
            "loc": "name",  "msg": "Enter a valid name"})

    token = str(uuid.uuid4())

    # Create new chat session
    chat_session = Chat(
        token=token,
        messages=[],
        name=name
    )

    redis_client = await redis.create_connection()

    # Store chat session in redis as JSON with the token as key
    result = await redis_client.json().set(str(token), Path.root_path(), chat_session.model_dump())
    print(f"Chat session created with token: {token}, result: {result}")

    # Set a timeout for redis data
    await redis_client.expire(str(token), 3600)

    return chat_session.model_dump()


# @route   GET /chat_history
# @desc    return chat history for a given token
# @access  Public

@chat.get("/chat_history")
async def chat_history(request: Request, token: str):
    redis_client = await redis.create_connection()

    cache = Cache(redis_client)
    data = await cache.get_chat_history(token)

    if data == None:
        raise HTTPException(
            status_code=400, detail="Session expired or does not exist")
    else:
        return data


# @route   Websocket /chat
# @desc    Socket for chatbot
# @access  Public

@chat.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket, token=Depends(get_token)):
    await manager.connect(websocket)
    redis_client = await redis.create_connection()
    producer = Producer(redis_client)
    consumer = StreamConsumer(redis_client)

    message_channel = "message_channel"
    response_channel = f"response_channel_{token}"


    try:
        while True:
            data = await websocket.receive_text()
            stream_data = {}
            stream_data[token] = data
            await producer.add_to_stream(data = stream_data, stream_channel = message_channel)
            response = await consumer.consume_stream(stream_channel=response_channel, count=1, block=0)
            for stream, messages in response:
                    for message_id, message_data in messages:
                        message_text = message_data[b'message'].decode('utf-8')
                        print("Sending message to websocket:", message_text)
                        await manager.send_personal_message(message_text, websocket)
                        # Delete message from queue after it has been processed
                        await consumer.delete_message(stream_channel=response_channel, message_id=message_id)

            print("stream consumed", response)


    except WebSocketDisconnect:
        manager.disconnect(websocket)
