import asyncio
import cv2
import numpy as np
import logging
import time
from typing import Dict, List, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from shared.schemas.camera import Camera, CameraStatus, CameraHealth
from shared.messaging.streams import StreamManager, StreamConfig
from shared.config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class CameraStream:
    camera: Camera
    cap: Optional[cv2.VideoCapture] = None
    task: Optional[asyncio.Task] = None
    running: bool = False
    frame_count: int = 0
    last_frame_time: float = 0
    fps_counter: List[float] = field(default_factory=list)
    error_count: int = 0
    last_error: Optional[str] = None
    reconnect_task: Optional[asyncio.Task] = None


class CameraManager:
    def __init__(self, stream_manager: StreamManager):
        self.stream_manager = stream_manager
        self.cameras: Dict[str, CameraStream] = {}
        self._frame_callback: Optional[Callable[[str, np.ndarray, Dict], Awaitable[None]]] = None
        self._running = False

    def set_frame_callback(self, callback: Callable[[str, np.ndarray, Dict], Awaitable[None]]):
        self._frame_callback = callback

    async def add_camera(self, camera: Camera) -> bool:
        if camera.id in self.cameras:
            logger.warning(f"Camera {camera.id} already exists")
            return False

        stream = CameraStream(camera=camera)
        self.cameras[camera.id] = stream
        logger.info(f"Added camera: {camera.id} ({camera.name})")

        if camera.enabled and self._running:
            await self._start_camera(stream)

        return True

    async def remove_camera(self, camera_id: str) -> bool:
        if camera_id not in self.cameras:
            return False

        await self._stop_camera(self.cameras[camera_id])
        del self.cameras[camera_id]
        logger.info(f"Removed camera: {camera_id}")
        return True

    async def update_camera(self, camera_id: str, updates: Dict) -> bool:
        if camera_id not in self.cameras:
            return False

        stream = self.cameras[camera_id]
        was_enabled = stream.camera.enabled

        for key, value in updates.items():
            if hasattr(stream.camera, key):
                setattr(stream.camera, key, value)

        stream.camera.updated_at = datetime.utcnow()

        if was_enabled and not stream.camera.enabled:
            await self._stop_camera(stream)
        elif not was_enabled and stream.camera.enabled and self._running:
            await self._start_camera(stream)

        return True

    def get_camera(self, camera_id: str) -> Optional[Camera]:
        if camera_id in self.cameras:
            return self.cameras[camera_id].camera
        return None

    def list_cameras(self) -> List[Camera]:
        return [s.camera for s in self.cameras.values()]

    async def start_all(self):
        self._running = True
        for stream in self.cameras.values():
            if stream.camera.enabled:
                await self._start_camera(stream)

    async def stop_all(self):
        self._running = False
        for stream in self.cameras.values():
            await self._stop_camera(stream)

    async def _start_camera(self, stream: CameraStream):
        if stream.running:
            return

        stream.running = True
        stream.task = asyncio.create_task(self._capture_loop(stream))
        logger.info(f"Started capture for camera: {stream.camera.id}")

    async def _stop_camera(self, stream: CameraStream):
        stream.running = False

        if stream.reconnect_task:
            stream.reconnect_task.cancel()
            stream.reconnect_task = None

        if stream.task:
            stream.task.cancel()
            try:
                await stream.task
            except asyncio.CancelledError:
                pass
            stream.task = None

        if stream.cap:
            stream.cap.release()
            stream.cap = None

        stream.camera.status = CameraStatus.OFFLINE
        logger.info(f"Stopped capture for camera: {stream.camera.id}")

    async def _capture_loop(self, stream: CameraStream):
        cam = stream.camera

        while stream.running:
            try:
                if stream.cap is None:
                    await self._connect_camera(stream)
                    if stream.cap is None:
                        await asyncio.sleep(settings.stream_reconnect_delay)
                        continue

                ret, frame = stream.cap.read()

                if not ret:
                    stream.error_count += 1
                    stream.last_error = "Failed to read frame"
                    logger.warning(f"Camera {cam.id}: Failed to read frame, reconnecting...")
                    await self._reconnect_camera(stream)
                    continue

                stream.frame_count += 1
                now = time.time()
                stream.last_frame_time = now
                stream.fps_counter.append(now)
                if len(stream.fps_counter) > 30:
                    stream.fps_counter.pop(0)

                stream.camera.status = CameraStatus.ONLINE
                stream.camera.fps = self._calculate_fps(stream.fps_counter)
                stream.camera.last_seen = datetime.utcnow()
                stream.camera.resolution = f"{frame.shape[1]}x{frame.shape[0]}"

                metadata = {
                    "camera_id": cam.id,
                    "frame_id": stream.frame_count,
                    "timestamp": datetime.utcnow().isoformat(),
                    "width": frame.shape[1],
                    "height": frame.shape[0],
                    "channels": frame.shape[2] if len(frame.shape) > 2 else 1,
                }

                if self._frame_callback:
                    await self._frame_callback(cam.id, frame, metadata)

            except asyncio.CancelledError:
                break
            except Exception as e:
                stream.error_count += 1
                stream.last_error = str(e)
                logger.error(f"Camera {cam.id} capture error: {e}")
                await self._reconnect_camera(stream)

        logger.info(f"Capture loop ended for camera: {cam.id}")

    def _calculate_fps(self, times: List[float]) -> float:
        if len(times) < 2:
            return 0.0
        return (len(times) - 1) / (times[-1] - times[0])

    async def _connect_camera(self, stream: CameraStream):
        cam = stream.camera
        try:
            url = self._build_stream_url(cam)
            logger.info(f"Connecting to camera {cam.id}: {url}")

            if settings.stream_hw_decode:
                stream.cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
                stream.cap.set(cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY)
            else:
                stream.cap = cv2.VideoCapture(url)

            stream.cap.set(cv2.CAP_PROP_BUFFERSIZE, settings.stream_buffer_size)
            stream.cap.set(cv2.CAP_PROP_FPS, 30)

            await asyncio.sleep(0.5)

            ret, _ = stream.cap.read()
            if not ret:
                raise ConnectionError("Initial frame read failed")

            cam.status = CameraStatus.ONLINE
            logger.info(f"Camera {cam.id} connected successfully")

        except Exception as e:
            stream.error_count += 1
            stream.last_error = str(e)
            cam.status = CameraStatus.ERROR
            cam.error_message = str(e)
            logger.error(f"Failed to connect camera {cam.id}: {e}")
            if stream.cap:
                stream.cap.release()
                stream.cap = None

    def _build_stream_url(self, camera: Camera) -> str:
        url = camera.stream_url
        if camera.username and camera.password:
            if "@" not in url:
                protocol_end = url.find("://") + 3
                url = url[:protocol_end] + f"{camera.username}:{camera.password}@" + url[protocol_end:]
        if camera.protocol.value == "rtsp" and camera.rtsp_transport:
            url += f"?rtsp_transport={camera.rtsp_transport}"
        return url

    async def _reconnect_camera(self, stream: CameraStream):
        if stream.cap:
            stream.cap.release()
            stream.cap = None

        stream.camera.status = CameraStatus.CONNECTING

        if stream.reconnect_task:
            stream.reconnect_task.cancel()

        async def _reconnect():
            await asyncio.sleep(settings.stream_reconnect_delay)
            if stream.running:
                await self._connect_camera(stream)

        stream.reconnect_task = asyncio.create_task(_reconnect())

    def get_health(self, camera_id: str) -> Optional[CameraHealth]:
        if camera_id not in self.cameras:
            return None

        stream = self.cameras[camera_id]
        return CameraHealth(
            camera_id=camera_id,
            status=stream.camera.status,
            last_frame_time=datetime.fromtimestamp(stream.last_frame_time) if stream.last_frame_time else None,
            fps=stream.camera.fps,
            latency_ms=0.0,
            error_count=stream.error_count,
            last_error=stream.last_error,
        )