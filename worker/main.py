from src.redis.config import Redis
from src.redis.cache import Cache
from src.schema.chat import Message
from src.model.gpt import GPT
from src.redis.stream import StreamConsumer
from src.redis.producer import Producer
from src.schema.chat import SourceEnum

import traceback

import asyncio


async def process_message(text, token, cache: Cache, gpt: GPT, producer: Producer):

    new_message = Message(
        msg=text,
        source=SourceEnum.user
    )
    print("Processing message:", new_message, "for token:", token)

    # get chat history (only last 5 messages)
    chat_history = await cache.get_chat_history(token=token, limit=10)
    if not chat_history:
        print("Session expired for token:", token)
        return

    # convert chat history messages to Message objects
    history_messages = [Message(**msg) for msg in chat_history['messages']]

    # add new message to history messages
    all_messages = history_messages + [new_message]

    print("All messages:", all_messages)

    # send all messages to gpt model
    gpt_message = await gpt.query(messages=all_messages)

    # send gpt response to response channel
    stream_data = {"message": gpt_message.msg}
    print("Sending GPT response to stream:", stream_data)
    await producer.add_to_stream(stream_data, f"response_channel_{token}")

    # stream expire in 1 hour
    await producer.expire(f"response_channel_{token}", 3600)

    # add new message and gpt response to chat history
    await cache.add_messages_to_cache(token=token, messages=[new_message.model_dump(), gpt_message.model_dump()])


async def main():
    redis = Redis()
    redis_client = await redis.create_connection()
    cache = Cache(redis_client)
    gpt = GPT()
    consumer = StreamConsumer(redis_client)
    producer = Producer(redis_client)


    print("Stream consumer started")
    print("Stream waiting for new messages (Press Ctrl+C to stop)")

    try:
        while True:
            response = await consumer.consume_stream(stream_channel="message_channel", count=1, block=0)
            if response:
                for stream, messages in response:
                    for message_id, message_data in messages:
                        token, text = [(k.decode('utf-8'), v.decode('utf-8')) for k, v in message_data.items()][0]

                        await process_message(text = text, token = token, cache = cache, gpt = gpt, producer = producer)

                        # Delete message from queue after it has been processed
                        await consumer.delete_message(stream_channel="message_channel", message_id=message_id)

    except KeyboardInterrupt:
        print("\nReceived interrupt signal, shutting down gracefully...")
    except Exception as e:
        print(f"Error in stream consumer: {e}")
        traceback.print_exc()

    finally:
        # Clean up resources
        print("Cleaning up...")
        try:
            await redis_client.aclose()
            print("Redis connection closed.")
        except Exception as e:
            print(f"Error closing Redis connection: {e}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProgram interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {e}")
