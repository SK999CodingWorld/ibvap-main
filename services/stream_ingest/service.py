import asyncio
import logging
import cv2
from typing import Optional, Callable, Awaitable, Dict, Any
from datetime import datetime

from shared.config.settings import settings
from shared.messaging.streams import StreamManager, StreamConfig
from shared.schemas.camera import Camera, CameraCreate
from .camera_manager import CameraManager

logger = logging.getLogger(__name__)


class StreamIngestService:
    def __init__(self):
        stream_config = StreamConfig(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            password=settings.redis_password,
        )
        self.stream_manager = StreamManager(stream_config)
        self.camera_manager = CameraManager(self.stream_manager)
        self._running = False
        self._frame_publish_task: Optional[asyncio.Task] = None

    async def start(self):
        await self.stream_manager.connect()
        self.camera_manager.set_frame_callback(self._on_frame)
        await self.camera_manager.start_all()
        self._running = True
        logger.info("Stream Ingest Service started")

    async def stop(self):
        self._running = False
        await self.camera_manager.stop_all()
        await self.stream_manager.disconnect()
        logger.info("Stream Ingest Service stopped")

    async def _on_frame(self, camera_id: str, frame, metadata: Dict[str, Any]):
        if not self._running:
            return

        try:
            stream_name = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            await self.stream_manager.add_frame(stream_name, buffer.tobytes(), metadata, max_len=settings.stream_buffer_size)
        except Exception as e:
            logger.error(f"Failed to publish frame for {camera_id}: {e}")

    def add_camera(self, camera: CameraCreate) -> Camera:
        from shared.utils.zones import create_default_zones
        import uuid
        import time

        cam = Camera(
            id=str(uuid.uuid4())[:8],
            **camera.model_dump(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        if not cam.zones:
            cam.zones = [z.id for z in create_default_zones(cam.id)]

        asyncio.create_task(self.camera_manager.add_camera(cam))
        return cam

    async def remove_camera(self, camera_id: str) -> bool:
        return await self.camera_manager.remove_camera(camera_id)

    async def update_camera(self, camera_id: str, updates: Dict) -> bool:
        return await self.camera_manager.update_camera(camera_id, updates)

    def get_camera(self, camera_id: str) -> Optional[Camera]:
        return self.camera_manager.get_camera(camera_id)

    def list_cameras(self) -> list:
        return self.camera_manager.list_cameras()

    def get_health(self, camera_id: str):
        return self.camera_manager.get_health(camera_id)