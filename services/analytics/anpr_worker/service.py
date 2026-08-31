import asyncio
import json
import logging
import cv2
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime
from ultralytics import YOLO

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    easyocr = None

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    PaddleOCR = None

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.tracking import TrackBatch, Track
from shared.schemas.event import Event, EventType

logger = logging.getLogger(__name__)


class ANPRWorker:
    def __init__(self, stream_manager: StreamManager, worker_id: str = "anpr-1"):
        self.stream_manager = stream_manager
        self.worker_id = worker_id
        self.plate_model: Optional[YOLO] = None
        self.ocr_reader = None
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "analytics_workers"
        self._consumer_name = worker_id

    async def start(self):
        await self._load_models()
        await self.stream_manager.create_consumer_group(
            StreamManager.TRACK_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        self._running = True

        for camera_id in self._get_camera_ids():
            stream_name = self.stream_manager.stream_name(StreamManager.TRACK_STREAM, camera_id)
            task = asyncio.create_task(self._process_stream(stream_name, camera_id))
            self._tasks.append(task)

        logger.info(f"ANPR Worker {self.worker_id} started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info(f"ANPR Worker {self.worker_id} stopped")

    async def _load_models(self):
        try:
            self.plate_model = YOLO("license_plate_detector.pt")
            self.plate_model.to(settings.detection_device)
            logger.info("Loaded license plate detection model")
        except Exception as e:
            logger.warning(f"Plate detection model not found, using vehicle crops: {e}")
            self.plate_model = None

        if PADDLEOCR_AVAILABLE:
            try:
                self.ocr_reader = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=settings.detection_device != 'cpu')
                logger.info("Loaded PaddleOCR")
            except Exception as e:
                logger.warning(f"PaddleOCR failed: {e}")

        if self.ocr_reader is None and EASYOCR_AVAILABLE:
            try:
                self.ocr_reader = easyocr.Reader(['en'], gpu=settings.detection_device != 'cpu')
                logger.info("Loaded EasyOCR")
            except Exception as e:
                logger.warning(f"EasyOCR failed: {e}")

        if self.ocr_reader is None:
            logger.error("No OCR engine available!")

    def _get_camera_ids(self) -> List[str]:
        """
        Retrieves all registered and enabled camera IDs for ANPR vehicle stream analysis.
        """
        from pathlib import Path
        camera_ids = set()

        possible_cam_paths = [
            Path("./cameras.json"),
            Path(__file__).resolve().parent.parent.parent.parent / "cameras.json",
            Path(__file__).resolve().parent.parent.parent / "camera_registry" / "cameras.json"
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
                except Exception:
                    pass

        if not camera_ids:
            camera_ids = {"default", "cam1", "BOP-01"}

        return sorted(list(camera_ids))

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
                            data_str = msg_data.get(b"data", msg_data.get("data"))
                            if isinstance(data_str, bytes):
                                data_str = data_str.decode()
                            track_batch = json.loads(data_str)
                            await self._process_tracks(track_batch, camera_id)
                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing tracks for ANPR: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"ANPR stream error: {e}")
                await asyncio.sleep(1)

    async def _process_tracks(self, track_batch: Dict, camera_id: str):
        tracks = [Track(**t) for t in track_batch.get("tracks", [])]
        vehicle_tracks = [t for t in tracks if t.class_name in ["car", "truck", "bus", "motorcycle"]]

        for track in vehicle_tracks:
            if track.track_id % 10 != 0:
                continue

            result = await self._recognize_plate(camera_id, track)
            if result:
                plate_text, ocr_conf, ocr_meta = result
                event = Event(
                    id=f"anpr_{track.track_id}_{int(datetime.utcnow().timestamp())}",
                    type=EventType.PLATE_DETECTED,
                    camera_id=camera_id,
                    track_id=track.track_id,
                    message=f"License plate detected: {plate_text} ({ocr_conf * 100:.1f}% confidence)",
                    data={
                        "plate_text": plate_text,
                        "class_name": track.class_name,
                        "confidence": track.confidence,
                        "ocr_confidence": ocr_conf,
                        "bbox": [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2],
                        "metadata": ocr_meta,
                    },
                    timestamp=datetime.utcnow(),
                    source="anpr_worker",
                )
                await self.stream_manager.add_event(StreamManager.EVENT_STREAM, event.model_dump())

    async def _recognize_plate(self, camera_id: str, track: Track) -> Optional[tuple]:
        if self.ocr_reader is None:
            return None

        try:
            frame_stream = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)
            latest = await self.stream_manager.read_stream_latest(frame_stream, count=1)
            if not latest:
                return None

            msg_id, msg_data = latest[0]
            frame_bytes = msg_data.get(b"data", msg_data.get("data"))
            metadata_str = msg_data.get(b"metadata", msg_data.get("metadata", "{}"))
            if isinstance(metadata_str, bytes):
                metadata_str = metadata_str.decode()
            import json
            metadata = json.loads(metadata_str)

            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is None:
                return None

            x1, y1, x2, y2 = map(int, [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2])
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)

            if x2 <= x1 or y2 <= y1:
                return None

            vehicle_crop = frame[y1:y2, x1:x2]
            if vehicle_crop.size == 0:
                return None

            plate_crop = vehicle_crop
            if self.plate_model:
                plate_results = self.plate_model(vehicle_crop, verbose=False)
                for r in plate_results:
                    boxes = r.boxes
                    if boxes is not None and len(boxes) > 0:
                        best_box = max(boxes, key=lambda b: b.conf[0])
                        px1, py1, px2, py2 = map(int, best_box.xyxy[0])
                        plate_crop = vehicle_crop[py1:py2, px1:px2]
                        break

            if plate_crop.size == 0 or plate_crop.shape[0] < 10 or plate_crop.shape[1] < 10:
                return None

            scale = max(2, 100 / plate_crop.shape[0])
            plate_crop = cv2.resize(plate_crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)

            candidates = []
            if hasattr(self.ocr_reader, 'ocr'):
                results = self.ocr_reader.ocr(gray, cls=True)
                for line in results:
                    if line:
                        for word in line:
                            if len(word) >= 2:
                                text_str = word[1][0]
                                score = float(word[1][1]) if len(word[1]) > 1 else 0.85
                                candidates.append((text_str, score))
            else:
                results = self.ocr_reader.readtext(gray)
                candidates = [(text, float(conf)) for _, text, conf in results if conf > 0.3]

            for text, ocr_conf in candidates:
                cleaned = text.strip().replace(" ", "").replace("-", "").upper()
                if len(cleaned) >= 4 and any(c.isdigit() for c in cleaned):
                    ocr_metadata = {
                        "raw_text": text,
                        "ocr_confidence": round(ocr_conf, 3),
                        "frame_id": metadata.get("frame_id", 0),
                        "frame_timestamp": metadata.get("timestamp"),
                        "vehicle_crop_box": [x1, y1, x2, y2],
                        "plate_crop_shape": list(plate_crop.shape[:2]),
                        "camera_id": camera_id,
                        "track_id": track.track_id,
                    }
                    return cleaned, ocr_conf, ocr_metadata

        except Exception as e:
            logger.debug(f"ANPR failed for track {track.track_id}: {e}")

        return None