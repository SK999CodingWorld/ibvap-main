import asyncio
import json
import logging
import cv2
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime

from shared.config.settings import settings
from shared.messaging.streams import StreamManager

logger = logging.getLogger(__name__)


class NightEnhanceWorker:
    def __init__(self, stream_manager: StreamManager, worker_id: str = "night-1"):
        self.stream_manager = stream_manager
        self.worker_id = worker_id
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "analytics_workers"
        self._consumer_name = worker_id

    async def start(self):
        await self.stream_manager.create_consumer_group(
            StreamManager.FRAME_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        self._running = True

        for camera_id in self._get_camera_ids():
            stream_name = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)
            task = asyncio.create_task(self._process_stream(stream_name, camera_id))
            self._tasks.append(task)

        logger.info(f"Night Enhance Worker {self.worker_id} started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info(f"Night Enhance Worker {self.worker_id} stopped")

    def _get_camera_ids(self) -> List[str]:
        return ["default"]

    async def _process_stream(self, stream_name: str, camera_id: str):
        streams = {stream_name: "0"}

        while self._running:
            try:
                results = await self.stream_manager.read_group(
                    self._consumer_group,
                    self._consumer_name,
                    streams,
                    count=10,
                    block=1000,
                )

                if not results:
                    continue

                for stream, messages in results:
                    for msg_id, msg_data in messages:
                        try:
                            frame_bytes = msg_data.get(b"data", msg_data.get("data"))
                            metadata_str = msg_data.get(b"metadata", msg_data.get("metadata", "{}"))
                            if isinstance(metadata_str, bytes):
                                metadata_str = metadata_str.decode()
                            import json
                            metadata = json.loads(metadata_str)

                            nparr = np.frombuffer(frame_bytes, np.uint8)
                            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            if frame is None:
                                continue

                            if self._is_night(frame):
                                enhanced = self._enhance_night(frame)
                                _, buffer = cv2.imencode(".jpg", enhanced, [cv2.IMWRITE_JPEG_QUALITY, 80])
                                enhanced_stream = self.stream_manager.stream_name("frames_enhanced", camera_id)
                                await self.stream_manager.add_frame(enhanced_stream, buffer.tobytes(), metadata)

                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error enhancing frame: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Night enhance stream error: {e}")
                await asyncio.sleep(1)

    def _is_night(self, frame: np.ndarray, threshold: float = 50.0) -> bool:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        return mean_brightness < threshold

    def _enhance_night(self, frame: np.ndarray) -> np.ndarray:
        enhanced = self._retinex_enhance(frame)
        enhanced = self._gamma_correction(enhanced, gamma=1.5)
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
        return enhanced

    def _retinex_enhance(self, img: np.ndarray, sigma_list: List[int] = [15, 80, 250]) -> np.ndarray:
        img = img.astype(np.float32) / 255.0
        retinex = np.zeros_like(img)

        for sigma in sigma_list:
            blur = cv2.GaussianBlur(img, (0, 0), sigma)
            retinex += np.log10(img + 1e-6) - np.log10(blur + 1e-6)

        retinex = retinex / len(sigma_list)
        retinex = (retinex - np.min(retinex)) / (np.max(retinex) - np.min(retinex) + 1e-6)
        return (retinex * 255).astype(np.uint8)

    def _gamma_correction(self, img: np.ndarray, gamma: float = 1.0) -> np.ndarray:
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        return cv2.LUT(img, table)

    def _clahe_enhance(self, img: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge((l, a, b))
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)