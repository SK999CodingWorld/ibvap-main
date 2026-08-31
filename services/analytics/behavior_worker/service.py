import asyncio
import json
import logging
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime
from collections import defaultdict, deque

from ultralytics import YOLO

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.tracking import TrackBatch, Track
from shared.schemas.event import Event, EventType

logger = logging.getLogger(__name__)


class BehaviorWorker:
    def __init__(self, stream_manager: StreamManager, worker_id: str = "behavior-1"):
        self.stream_manager = stream_manager
        self.worker_id = worker_id
        self.pose_model: Optional[YOLO] = None
        self.track_history: Dict[int, deque] = defaultdict(lambda: deque(maxlen=30))
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

        logger.info(f"Behavior Worker {self.worker_id} started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info(f"Behavior Worker {self.worker_id} stopped")

    async def _load_models(self):
        try:
            self.pose_model = YOLO("yolov8n-pose.pt")
            self.pose_model.to(settings.detection_device)
            logger.info("Loaded YOLOv8 pose model")
        except Exception as e:
            logger.warning(f"Pose model not available: {e}")

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
                            logger.error(f"Error processing tracks for Behavior: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Behavior stream error: {e}")
                await asyncio.sleep(1)

    async def _process_tracks(self, track_batch: Dict, camera_id: str):
        tracks = [Track(**t) for t in track_batch.get("tracks", [])]
        person_tracks = [t for t in tracks if t.class_name == "person"]

        for track in person_tracks:
            self._update_history(track)

            behaviors = self._analyze_behavior(track)
            for behavior_type, details in behaviors:
                event = Event(
                    id=f"behavior_{track.track_id}_{behavior_type}_{int(datetime.utcnow().timestamp())}",
                    type=EventType.BEHAVIOR_ANOMALY,
                    camera_id=camera_id,
                    track_id=track.track_id,
                    message=f"Behavior detected: {behavior_type} - {details}",
                    data={
                        "behavior_type": behavior_type,
                        "details": details,
                        "class_name": track.class_name,
                        "confidence": track.confidence,
                        "bbox": [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2],
                    },
                    timestamp=datetime.utcnow(),
                    source="behavior_worker",
                )
                await self.stream_manager.add_event(StreamManager.EVENT_STREAM, event.model_dump())

    def _update_history(self, track: Track):
        key = (track.camera_id, track.track_id)
        self.track_history[key].append({
            "center": track.center,
            "bbox": [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2],
            "timestamp": track.last_update.timestamp(),
        })

    def _analyze_behavior(self, track: Track) -> List[tuple]:
        key = (track.camera_id, track.track_id)
        history = self.track_history[key]

        if len(history) < 10:
            return []

        behaviors = []
        centers = np.array([h["center"] for h in history])
        timestamps = np.array([h["timestamp"] for h in history])

        distances = np.linalg.norm(np.diff(centers, axis=0), axis=1)
        time_diffs = np.diff(timestamps)
        speeds = distances / np.maximum(time_diffs, 0.001)

        avg_speed = np.mean(speeds[-10:]) if len(speeds) >= 10 else 0

        if avg_speed > 50:
            behaviors.append(("running", f"High speed movement: {avg_speed:.1f} px/s"))
        elif avg_speed < 2:
            behaviors.append(("loitering", f"Low movement: {avg_speed:.1f} px/s"))

        if len(centers) >= 20:
            recent = centers[-20:]
            x_range = np.max(recent[:, 0]) - np.min(recent[:, 0])
            y_range = np.max(recent[:, 1]) - np.min(recent[:, 1])
            if x_range < 30 and y_range < 30:
                dwell_time = timestamps[-1] - timestamps[-20]
                if dwell_time > 30:
                    behaviors.append(("loitering", f"Stationary for {dwell_time:.0f}s in small area"))

        if self.pose_model:
            try:
                frame_stream = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, track.camera_id)
                import asyncio
                latest = asyncio.run_coroutine_threadsafe(
                    self.stream_manager.read_stream_latest(frame_stream, count=1),
                    asyncio.get_event_loop()
                ).result(timeout=0.5)
                if latest:
                    msg_id, msg_data = latest[0]
                    frame_bytes = msg_data.get(b"data", msg_data.get("data"))
                    import cv2
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        x1, y1, x2, y2 = map(int, [track.bbox.x1, track.bbox.y1, track.bbox.x2, track.bbox.y2])
                        person_crop = frame[y1:y2, x1:x2]
                        if person_crop.size > 0:
                            pose_results = self.pose_model(person_crop, verbose=False)
                            for r in pose_results:
                                if r.keypoints is not None and len(r.keypoints) > 0:
                                    kpts = r.keypoints.xy[0].cpu().numpy()
                                    fall_detected = self._detect_fall(kpts)
                                    if fall_detected:
                                        behaviors.append(("fall_detected", "Person fall detected from pose"))
            except Exception:
                pass

        return behaviors

    def _detect_fall(self, keypoints: np.ndarray) -> bool:
        if len(keypoints) < 17:
            return False

        nose = keypoints[0]
        left_shoulder = keypoints[5]
        right_shoulder = keypoints[6]
        left_hip = keypoints[11]
        right_hip = keypoints[12]
        left_ankle = keypoints[15]
        right_ankle = keypoints[16]

        shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
        hip_y = (left_hip[1] + right_hip[1]) / 2
        ankle_y = (left_ankle[1] + right_ankle[1]) / 2

        torso_vertical = abs(shoulder_y - hip_y)
        body_vertical = abs(nose[1] - ankle_y)

        if body_vertical < torso_vertical * 1.5:
            return True

        return False