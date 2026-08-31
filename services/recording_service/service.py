import asyncio
import cv2
import numpy as np
import logging
import os
import time
import shutil
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field
from collections import deque

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.tracking import TrackBatch, Track
from shared.schemas.event import Event, EventType

logger = logging.getLogger(__name__)


@dataclass
class CircularBuffer:
    frames: deque = field(default_factory=lambda: deque(maxlen=0))
    writer: Optional[cv2.VideoWriter] = None
    writer_path: str = ""
    frame_size: tuple = (0, 0)
    fps: float = 30.0
    segment_duration: int = 300
    segment_start: float = 0
    fourcc: int = cv2.VideoWriter_fourcc(*'mp4v')

    def __post_init__(self):
        self.frames = deque(maxlen=int(self.fps * self.segment_duration))

    def add_frame(self, frame: np.ndarray, timestamp: float):
        if len(self.frames) == 0:
            self.frame_size = (frame.shape[1], frame.shape[0])
            self.segment_start = timestamp
        self.frames.append((frame.copy(), timestamp))

    def get_recent_frames(self, seconds: float) -> List[tuple]:
        cutoff = time.time() - seconds
        return [(f, t) for f, t in self.frames if t >= cutoff]

    def start_segment(self, path: str):
        self.writer_path = path
        self.writer = cv2.VideoWriter(
            path, self.fourcc, self.fps, self.frame_size
        )

    def write_segment(self, frames: List[tuple]):
        if self.writer and frames:
            for frame, _ in frames:
                self.writer.write(frame)

    def close_segment(self):
        if self.writer:
            self.writer.release()
            self.writer = None


class RecordingService:
    def __init__(self, stream_manager: StreamManager, storage_path: str = "./recordings"):
        self.stream_manager = stream_manager
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.buffers: Dict[str, CircularBuffer] = {}
        self.active_recordings: Dict[str, asyncio.Task] = {}
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "recording_service"
        self._consumer_name = "recorder-1"

    async def start(self):
        self.storage_path.mkdir(parents=True, exist_ok=True)
        await self.stream_manager.create_consumer_group(
            StreamManager.TRACK_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        await self.stream_manager.create_consumer_group(
            StreamManager.EVENT_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        self._running = True

        for camera_id in self._get_camera_ids():
            self.buffers[camera_id] = CircularBuffer(
                fps=30.0,
                segment_duration=settings.record_segment_duration,
            )
            task = asyncio.create_task(self._process_tracks(camera_id))
            self._tasks.append(task)

            task = asyncio.create_task(self._process_events(camera_id))
            self._tasks.append(task)

        cleanup_task = asyncio.create_task(self._cleanup_loop())
        self._tasks.append(cleanup_task)

        logger.info("Recording Service started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        for buffer in self.buffers.values():
            buffer.close_segment()
        logger.info("Recording Service stopped")

    def _get_camera_ids(self) -> List[str]:
        return ["default"]

    def enable_camera(self, camera_id: str, fps: float = 30.0):
        if camera_id not in self.buffers:
            self.buffers[camera_id] = CircularBuffer(
                fps=fps,
                segment_duration=settings.record_segment_duration,
            )

    def disable_camera(self, camera_id: str):
        if camera_id in self.buffers:
            self.buffers[camera_id].close_segment()
            del self.buffers[camera_id]

    async def _process_tracks(self, camera_id: str):
        stream_name = self.stream_manager.stream_name(StreamManager.TRACK_STREAM, camera_id)
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
                            import json
                            track_batch = json.loads(data_str)
                            await self._handle_tracks(camera_id, track_batch)
                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing tracks for recording: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Recording track stream error: {e}")
                await asyncio.sleep(1)

    async def _process_events(self, camera_id: str):
        stream_name = self.stream_manager.stream_name(StreamManager.EVENT_STREAM, camera_id)
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
                            import json
                            event_data = json.loads(data_str)
                            event = Event(**event_data)
                            await self._handle_event(camera_id, event)
                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing event for recording: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Recording event stream error: {e}")
                await asyncio.sleep(1)

    async def _handle_tracks(self, camera_id: str, track_batch: Dict):
        buffer = self.buffers.get(camera_id)
        if not buffer:
            return

        frame_stream = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)
        latest = await self.stream_manager.read_stream_latest(frame_stream, count=1)
        if not latest:
            return

        msg_id, msg_data = latest[0]
        frame_bytes = msg_data.get(b"data", msg_data.get("data"))
        metadata_str = msg_data.get(b"metadata", msg_data.get("metadata", "{}"))
        if isinstance(metadata_str, bytes):
            metadata_str = metadata_str.decode()

        import json
        metadata = json.loads(metadata_str)

        import numpy as np
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return

        timestamp = time.time()
        buffer.add_frame(frame, timestamp)

    async def _handle_event(self, camera_id: str, event: Event):
        if event.type not in [
            EventType.ZONE_ENTRY, EventType.ZONE_EXIT, EventType.LINE_CROSS,
            EventType.FACE_MATCHED, EventType.PLATE_MATCHED, EventType.BEHAVIOR_ANOMALY,
            EventType.ALERT_TRIGGERED
        ]:
            return

        buffer = self.buffers.get(camera_id)
        if not buffer:
            return

        pre_frames = buffer.get_recent_frames(10)
        post_duration = 5
        await self._save_event_clip(camera_id, event, pre_frames, post_duration)

    async def _save_event_clip(self, camera_id: str, event: Event, pre_frames: List[tuple], post_duration: float):
        try:
            event_dir = self.storage_path / camera_id / "events" / event.type.value
            event_dir.mkdir(parents=True, exist_ok=True)

            timestamp_str = event.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp_str}_{event.track_id or 'unknown'}_{event.id[:8]}.mp4"
            filepath = event_dir / filename

            all_frames = pre_frames.copy()
            end_time = time.time() + post_duration

            frame_stream = self.stream_manager.stream_name(StreamManager.FRAME_STREAM, camera_id)

            while time.time() < end_time and self._running:
                latest = await self.stream_manager.read_stream_latest(frame_stream, count=1)
                if latest:
                    msg_id, msg_data = latest[0]
                    frame_bytes = msg_data.get(b"data", msg_data.get("data"))
                    import numpy as np
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        all_frames.append((frame, time.time()))
                await asyncio.sleep(0.1)

            if not all_frames:
                return

            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            h, w = all_frames[0][0].shape[:2]
            writer = cv2.VideoWriter(str(filepath), fourcc, 30.0, (w, h))

            for frame, _ in all_frames:
                writer.write(frame)
            writer.release()

            logger.info(f"Saved event clip: {filepath} ({len(all_frames)} frames)")

            # Persist .json sidecar metadata alongside event recording clip
            meta_path = filepath.with_suffix(".json")
            sidecar_meta = {
                "event_id": event.id,
                "event_type": event.type.value,
                "camera_id": camera_id,
                "track_id": event.track_id,
                "timestamp": event.timestamp.isoformat(),
                "clip_path": str(filepath),
                "frame_count": len(all_frames),
                "resolution": [w, h],
                "fps": 30.0,
                "event_data": event.data,
                "created_at": datetime.utcnow().isoformat(),
            }
            try:
                with open(meta_path, "w", encoding="utf-8") as f:
                    json.dump(sidecar_meta, f, indent=2)
                logger.info(f"Saved event sidecar metadata: {meta_path}")
            except Exception as meta_err:
                logger.error(f"Failed to write event sidecar metadata: {meta_err}")

            event.data["clip_path"] = str(filepath)
            event.data["metadata_path"] = str(meta_path)
            await self.stream_manager.add_event(StreamManager.EVENT_STREAM, event.model_dump())

        except Exception as e:
            logger.error(f"Failed to save event clip: {e}")

    async def _cleanup_loop(self):
        while self._running:
            try:
                await self._cleanup_old_recordings()
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
                await asyncio.sleep(60)

    async def _cleanup_old_recordings(self):
        if settings.record_retention_days <= 0:
            return

        cutoff = time.time() - (settings.record_retention_days * 86400)

        for camera_dir in self.storage_path.iterdir():
            if not camera_dir.is_dir():
                continue

            for event_type_dir in (camera_dir / "events").iterdir():
                if not event_type_dir.is_dir():
                    continue

                for clip in event_type_dir.glob("*.mp4"):
                    try:
                        mtime = clip.stat().st_mtime
                        if mtime < cutoff:
                            clip.unlink()
                            meta_file = clip.with_suffix(".json")
                            if meta_file.exists():
                                meta_file.unlink()
                            logger.info(f"Deleted old clip & metadata: {clip}")
                    except Exception as e:
                        logger.warning(f"Failed to delete {clip}: {e}")

    def get_storage_info(self) -> Dict:
        total_size = 0
        clip_count = 0
        for clip in self.storage_path.rglob("*.mp4"):
            try:
                total_size += clip.stat().st_size
                clip_count += 1
            except:
                pass

        return {
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "clip_count": clip_count,
            "cameras": list(self.buffers.keys()),
        }

    async def export_evidence(self, camera_id: str, start_time: datetime, end_time: datetime) -> Optional[str]:
        buffer = self.buffers.get(camera_id)
        if not buffer:
            return None

        export_dir = self.storage_path / camera_id / "exports"
        export_dir.mkdir(parents=True, exist_ok=True)

        filename = f"evidence_{start_time.strftime('%Y%m%d_%H%M%S')}_{end_time.strftime('%Y%m%d_%H%M%S')}.mp4"
        filepath = export_dir / filename

        seconds = (end_time - start_time).total_seconds()
        frames = buffer.get_recent_frames(seconds + 30)

        if not frames:
            return None

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        h, w = frames[0][0].shape[:2]
        writer = cv2.VideoWriter(str(filepath), fourcc, 30.0, (w, h))

        written_count = 0
        for frame, ts in frames:
            frame_time = datetime.fromtimestamp(ts)
            if start_time <= frame_time <= end_time:
                writer.write(frame)
                written_count += 1

        writer.release()

        # Persist .json sidecar metadata alongside exported evidence video clip
        sidecar_meta = {
            "camera_id": camera_id,
            "export_filename": filename,
            "export_path": str(filepath),
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": seconds,
            "frame_count": written_count,
            "resolution": [w, h],
            "fps": 30.0,
            "created_at": datetime.utcnow().isoformat(),
        }
        meta_filepath = filepath.with_suffix(".json")
        try:
            with open(meta_filepath, "w", encoding="utf-8") as f:
                json.dump(sidecar_meta, f, indent=2)
            logger.info(f"Saved evidence sidecar metadata: {meta_filepath}")
        except Exception as e:
            logger.error(f"Failed to write evidence sidecar metadata: {e}")

        return str(filepath) if written_count > 0 else None