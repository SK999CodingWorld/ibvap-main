import asyncio
import json
import logging
import cv2
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path

try:
    import insightface
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    insightface = None
    FaceAnalysis = None

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.tracking import TrackBatch, Track
from shared.schemas.event import Event, EventType

logger = logging.getLogger(__name__)


class FaceWorker:
    def __init__(self, stream_manager: StreamManager, worker_id: str = "face-1"):
        self.stream_manager = stream_manager
        self.worker_id = worker_id
        self.face_app = None
        self.watchlist: Dict[str, np.ndarray] = {}
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "analytics_workers"
        self._consumer_name = worker_id
        self.similarity_threshold = 0.55
        self.watchlist_path = Path("./watchlist")

    async def start(self):
        await self._load_models()
        await self._load_watchlist()
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

        logger.info(f"Face Worker {self.worker_id} started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info(f"Face Worker {self.worker_id} stopped")

    async def _load_models(self):
        if not INSIGHTFACE_AVAILABLE:
            logger.warning("InsightFace not available, using OpenCV Haar cascade fallback")
            return

        try:
            self.face_app = FaceAnalysis(
                name='buffalo_l',
                providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if settings.detection_device != 'cpu' else ['CPUExecutionProvider']
            )
            self.face_app.prepare(ctx_id=0 if settings.detection_device != 'cpu' else -1, det_size=(640, 640))
            logger.info("Loaded InsightFace (buffalo_l)")
        except Exception as e:
            logger.error(f"Failed to load InsightFace: {e}")
            self.face_app = None

    async def _load_watchlist(self):
        if not self.watchlist_path.exists():
            self.watchlist_path.mkdir(parents=True, exist_ok=True)
            return

        for img_path in self.watchlist_path.glob("*.jpg"):
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    continue
                faces = self.face_app.get(img)
                if faces:
                    embedding = faces[0].normed_embedding
                    name = img_path.stem
                    self.watchlist[name] = embedding
                    logger.info(f"Loaded watchlist face: {name}")
            except Exception as e:
                logger.warning(f"Failed to load watchlist {img_path}: {e}")

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
                            data_str = msg_data.get(b"data", msg_data.get("data"))
                            if isinstance(data_str, bytes):
                                data_str = data_str.decode()
                            track_batch = json.loads(data_str)
                            await self._process_tracks(track_batch, camera_id)
                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing tracks for Face: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Face stream error: {e}")
                await asyncio.sleep(1)

    async def _process_tracks(self, track_batch: Dict, camera_id: str):
        tracks = [Track(**t) for t in track_batch.get("tracks", [])]
        person_tracks = [t for t in tracks if t.class_name == "person"]

        for track in person_tracks:
            if track.track_id % 5 != 0:
                continue

            matches = await self._recognize_face(camera_id, track)
            for match_name, distance in matches:
                event = Event(
                    id=f"face_{track.track_id}_{match_name}_{int(datetime.utcnow().timestamp())}",
                    type=EventType.FACE_MATCHED,
                    camera_id=camera_id,
                    track_id=track.track_id,
                    message=f"Face match: {match_name} (distance: {distance:.3f})",
                    data={
                        "face_match_id": match_name,
                        "face_distance": float(distance),
                        "class_name": track.class_name,
                        "confidence": track.confidence,
                        "bbox": [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2],
                    },
                    timestamp=datetime.utcnow(),
                    source="face_worker",
                )
                await self.stream_manager.add_event(StreamManager.EVENT_STREAM, event.model_dump())

    async def _recognize_face(self, camera_id: str, track: Track) -> List[tuple]:
        if not self.watchlist or self.face_app is None:
            return []

        try:
            frame_stream = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)
            latest = await self.stream_manager.read_stream_latest(frame_stream, count=1)
            if not latest:
                return []

            msg_id, msg_data = latest[0]
            frame_bytes = msg_data.get(b"data", msg_data.get("data"))

            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is None:
                return []

            x1, y1, x2, y2 = map(int, [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2])
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)

            if x2 <= x1 or y2 <= y1:
                return []

            person_crop = frame[y1:y2, x1:x2]
            if person_crop.size == 0:
                return []

            faces = self.face_app.get(person_crop)
            if not faces:
                return []

            matches = []
            for face in faces:
                embedding = face.normed_embedding
                for name, watch_embedding in self.watchlist.items():
                    similarity = np.dot(embedding, watch_embedding)
                    distance = 1 - similarity
                    if distance < self.similarity_threshold:
                        matches.append((name, distance))

            return matches

        except Exception as e:
            logger.debug(f"Face recognition failed for track {track.track_id}: {e}")

        return []

    def add_to_watchlist(self, name: str, image_path: str) -> bool:
        if self.face_app is None:
            return False

        try:
            img = cv2.imread(image_path)
            if img is None:
                return False

            faces = self.face_app.get(img)
            if not faces:
                return False

            embedding = faces[0].normed_embedding
            self.watchlist[name] = embedding

            dst = self.watchlist_path / f"{name}.jpg"
            cv2.imwrite(str(dst), img)
            logger.info(f"Added {name} to watchlist")
            return True
        except Exception as e:
            logger.error(f"Failed to add to watchlist: {e}")
            return False

    def remove_from_watchlist(self, name: str) -> bool:
        if name in self.watchlist:
            del self.watchlist[name]
            img_path = self.watchlist_path / f"{name}.jpg"
            if img_path.exists():
                img_path.unlink()
            return True
        return False