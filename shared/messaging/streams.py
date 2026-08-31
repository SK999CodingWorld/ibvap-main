import json
import time
from typing import Any, Dict, List, Optional, Callable, AsyncGenerator
from dataclasses import dataclass
from datetime import datetime
import redis.asyncio as redis
from redis.asyncio import Redis
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


@dataclass
class StreamConfig:
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    max_connections: int = 50
    decode_responses: bool = False


class StreamManager:
    def __init__(self, config: StreamConfig):
        self.config = config
        self._pool: Optional[redis.ConnectionPool] = None
        self._client: Optional[Redis] = None

    async def connect(self):
        self._pool = redis.ConnectionPool(
            host=self.config.host,
            port=self.config.port,
            db=self.config.db,
            password=self.config.password,
            max_connections=self.config.max_connections,
            decode_responses=self.config.decode_responses,
        )
        self._client = redis.Redis(connection_pool=self._pool)
        await self._client.ping()
        logger.info("Redis connection established")

    async def disconnect(self):
        if self._client:
            await self._client.close()
        if self._pool:
            await self._pool.disconnect()
        logger.info("Redis connection closed")

    @property
    def client(self) -> Redis:
        if not self._client:
            raise RuntimeError("Not connected. Call connect() first.")
        return self._client

    async def add_frame(self, stream: str, frame_data: bytes, metadata: Dict[str, Any], max_len: int = 100) -> str:
        payload = {
            "data": frame_data,
            "metadata": json.dumps(metadata),
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.client.xadd(stream, payload, maxlen=max_len, approximate=True)

    async def add_detection(self, stream: str, detection_batch: Dict[str, Any], max_len: int = 1000) -> str:
        payload = {
            "data": json.dumps(detection_batch),
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.client.xadd(stream, payload, maxlen=max_len, approximate=True)

    async def add_track(self, stream: str, track_batch: Dict[str, Any], max_len: int = 1000) -> str:
        payload = {
            "data": json.dumps(track_batch),
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.client.xadd(stream, payload, maxlen=max_len, approximate=True)

    async def add_alert(self, stream: str, alert: Dict[str, Any], max_len: int = 5000) -> str:
        payload = {
            "data": json.dumps(alert),
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.client.xadd(stream, payload, maxlen=max_len, approximate=True)

    async def add_event(self, stream: str, event: Dict[str, Any], max_len: int = 10000) -> str:
        payload = {
            "data": json.dumps(event),
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.client.xadd(stream, payload, maxlen=max_len, approximate=True)

    async def read_stream(
        self,
        streams: Dict[str, str],
        count: int = 10,
        block: int = 5000,
    ) -> List[tuple]:
        return await self.client.xread(streams, count=count, block=block)

    async def read_stream_latest(self, stream: str, count: int = 1) -> List[tuple]:
        return await self.client.xrevrange(stream, count=count)

    async def create_consumer_group(self, stream: str, group: str, consumer: str, mkstream: bool = True):
        try:
            await self.client.xgroup_create(stream, group, id="0", mkstream=mkstream)
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    async def read_group(
        self,
        group: str,
        consumer: str,
        streams: Dict[str, str],
        count: int = 10,
        block: int = 5000,
    ) -> List[tuple]:
        return await self.client.xreadgroup(group, consumer, streams, count=count, block=block)

    async def ack(self, stream: str, group: str, *ids: str):
        await self.client.xack(stream, group, *ids)

    async def claim_pending(
        self,
        stream: str,
        group: str,
        consumer: str,
        min_idle_time: int = 30000,
        count: int = 100,
    ) -> List[tuple]:
        return await self.client.xautoclaim(stream, group, consumer, min_idle_time, count=count)

    def stream_name(self, prefix: str, camera_id: str) -> str:
        return f"{prefix}:{camera_id}"

    FRAME_STREAM = "frames"
    DETECTION_STREAM = "detections"
    TRACK_STREAM = "tracks"
    ALERT_STREAM = "alerts"
    EVENT_STREAM = "events"
    CONTROL_STREAM = "control"