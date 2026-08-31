import asyncio
import json
import logging
import time
import cv2
import numpy as np
from typing import Optional, Dict, Any, List
from datetime import datetime
from ultralytics import YOLO

from shared.config.settings import settings
from shared.messaging.streams import StreamManager, StreamConfig
from shared.schemas.detection import Detection, DetectionBatch, BoundingBox
from shared.utils.vision import FPSCounter

logger = logging.getLogger(__name__)


class DetectionWorker:
    def __init__(self, stream_manager: StreamManager, worker_id: str = "detector-1"):
        self.stream_manager = stream_manager
        self.worker_id = worker_id
        self.model: Optional[YOLO] = None
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self.fps_counter = FPSCounter()
        self._consumer_group = "detection_workers"
        self._consumer_name = worker_id

    async def start(self):
        await self._load_model()
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

        logger.info(f"Detection Worker {self.worker_id} started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info(f"Detection Worker {self.worker_id} stopped")

    async def _load_model(self):
        try:
            self.model = YOLO(settings.detection_model)
            self.model.to(settings.detection_device)
            if settings.detection_half:
                self.model.model.half()
            logger.info(f"Loaded model: {settings.detection_model} on {settings.detection_device}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _get_camera_ids(self) -> List[str]:
        """
        Retrieves all registered and enabled camera IDs from camera registry storage (cameras.json),
        zones configurations (zones.json), or application settings.
        """
        from pathlib import Path
        camera_ids = set()

        # 1. Query persistent camera registry storage (cameras.json)
        possible_cam_paths = [
            Path("./cameras.json"),
            Path(__file__).resolve().parent.parent.parent / "cameras.json",
            Path(__file__).resolve().parent.parent / "camera_registry" / "cameras.json"
        ]
        for cam_path in possible_cam_paths:
            if cam_path.exists():
                try:
                    with open(cam_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("enabled", True):
                                cid = item.get("id") or item.get("camera_id")
                                if cid:
                                    camera_ids.add(str(cid))
                    elif isinstance(data, dict):
                        for cid, item in data.items():
                            if isinstance(item, dict) and item.get("enabled", True):
                                camera_ids.add(str(cid))
                except Exception as e:
                    logger.warning(f"Could not parse camera registry at {cam_path}: {e}")

        # 2. Query zones.json for any associated active camera IDs
        possible_zone_paths = [
            Path("./zones.json"),
            Path(__file__).resolve().parent.parent.parent / "zones.json"
        ]
        for zone_path in possible_zone_paths:
            if zone_path.exists():
                try:
                    with open(zone_path, "r", encoding="utf-8") as f:
                        zdata = json.load(f)
                    if isinstance(zdata, list):
                        for z in zdata:
                            if isinstance(z, dict):
                                cid = z.get("config", {}).get("camera_id") or z.get("camera_id")
                                if cid:
                                    camera_ids.add(str(cid))
                    elif isinstance(zdata, dict):
                        cid = zdata.get("config", {}).get("camera_id") or zdata.get("camera_id")
                        if cid:
                            camera_ids.add(str(cid))
                except Exception as e:
                    logger.warning(f"Could not parse zones at {zone_path}: {e}")

        # 3. Check environment or settings fallback
        configured_cams = getattr(settings, "cameras", None) or getattr(settings, "camera_ids", None)
        if configured_cams:
            if isinstance(configured_cams, list):
                camera_ids.update([str(c) for c in configured_cams])
            elif isinstance(configured_cams, str):
                camera_ids.update([c.strip() for c in configured_cams.split(",") if c.strip()])

        # If no cameras configured in storage, fallback to default surveillance camera
        if not camera_ids:
            camera_ids = {"default", "BOP-01"}

        result = sorted(list(camera_ids))
        logger.info(f"Discovered {len(result)} registered active camera(s): {result}")
        return result

    async def _process_stream(self, stream_name: str, camera_id: str):
        streams = {stream_name: "0"}

        while self._running:
            try:
                results = await self.stream_manager.read_group(
                    self._consumer_group,
                    self._consumer_name,
                    streams,
                    count=1,
                    block=1000,
                )

                if not results:
                    continue

                for stream, messages in results:
                    for msg_id, msg_data in messages:
                        try:
                            await self._process_frame(msg_id, msg_data, camera_id)
                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing frame: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Stream processing error: {e}")
                await asyncio.sleep(1)

    async def _process_frame(self, msg_id: str, msg_data: Dict, camera_id: str):
        frame_bytes = msg_data.get(b"data", msg_data.get("data"))
        metadata_str = msg_data.get(b"metadata", msg_data.get("metadata", "{}"))

        if isinstance(metadata_str, bytes):
            metadata_str = metadata_str.decode()

        import json
        metadata = json.loads(metadata_str)

        frame_id = metadata.get("frame_id", 0)
        timestamp = datetime.fromisoformat(metadata.get("timestamp", datetime.utcnow().isoformat()))
        width = metadata.get("width", 640)
        height = metadata.get("height", 480)

        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            logger.warning(f"Failed to decode frame {frame_id} from {camera_id}")
            return

        start_time = time.time()
        results = self.model(
            frame,
            verbose=False,
            conf=settings.detection_conf,
            iou=settings.detection_iou,
            classes=settings.detection_classes,
            imgsz=settings.detection_imgsz,
            half=settings.detection_half,
        )

        detections = []
        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue

            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].cpu().numpy()

                bbox = BoundingBox(x1=float(xyxy[0]), y1=float(xyxy[1]), x2=float(xyxy[2]), y2=float(xyxy[3]))

                detections.append(Detection(
                    class_id=cls_id,
                    class_name=cls_name,
                    confidence=conf,
                    bbox=bbox,
                ))

        inference_time = (time.time() - start_time) * 1000
        self.fps_counter.tick()

        batch = DetectionBatch(
            camera_id=camera_id,
            frame_id=frame_id,
            timestamp=timestamp,
            detections=detections,
            inference_time_ms=inference_time,
            image_shape=(height, width),
        )

        det_stream = self.stream_manager.stream_name(StreamManager.DETECTION_STREAM, camera_id)
        await self.stream_manager.add_detection(det_stream, batch.model_dump())