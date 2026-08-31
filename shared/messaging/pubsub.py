import json
import asyncio
from typing import Any, Dict, List, Optional, Callable, Awaitable
from datetime import datetime
import redis.asyncio as redis
from redis.asyncio import Redis
import logging

logger = logging.getLogger(__name__)


class PubSubManager:
    def __init__(self, redis_client: Redis):
        self._client = redis_client
        self._pubsub: Optional[redis.client.PubSub] = None
        self._subscriptions: Dict[str, List[Callable[[Dict], Awaitable[None]]]] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def subscribe(self, channel: str, handler: Callable[[Dict], Awaitable[None]]):
        if channel not in self._subscriptions:
            self._subscriptions[channel] = []
        self._subscriptions[channel].append(handler)

        if self._pubsub:
            await self._pubsub.subscribe(channel)

    async def unsubscribe(self, channel: str, handler: Optional[Callable] = None):
        if channel in self._subscriptions:
            if handler:
                self._subscriptions[channel].remove(handler)
            else:
                self._subscriptions[channel].clear()

            if not self._subscriptions[channel] and self._pubsub:
                await self._pubsub.unsubscribe(channel)
                del self._subscriptions[channel]

    async def publish(self, channel: str, message: Dict[str, Any]):
        payload = json.dumps({
            "data": message,
            "timestamp": datetime.utcnow().isoformat(),
        })
        await self._client.publish(channel, payload)

    async def start(self):
        if self._running:
            return

        self._pubsub = self._client.pubsub()
        for channel in self._subscriptions:
            await self._pubsub.subscribe(channel)

        self._running = True
        self._task = asyncio.create_task(self._listen())
        logger.info("PubSub started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._pubsub:
            await self._pubsub.close()
        logger.info("PubSub stopped")

    async def _listen(self):
        try:
            async for message in self._pubsub.listen():
                if not self._running:
                    break
                if message["type"] == "message":
                    channel = message["channel"].decode() if isinstance(message["channel"], bytes) else message["channel"]
                    try:
                        data = json.loads(message["data"].decode() if isinstance(message["data"], bytes) else message["data"])
                        payload = data.get("data", {})
                        if channel in self._subscriptions:
                            for handler in self._subscriptions[channel]:
                                try:
                                    await handler(payload)
                                except Exception as e:
                                    logger.error(f"Handler error for {channel}: {e}")
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON on {channel}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"PubSub listen error: {e}")

    CHANNEL_ALERTS = "alerts"
    CHANNEL_EVENTS = "events"
    CHANNEL_CONTROL = "control"
    CHANNEL_CAMERA_STATUS = "camera_status"
    CHANNEL_SYSTEM = "system"