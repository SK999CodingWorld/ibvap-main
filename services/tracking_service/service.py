import asyncio
import json
import logging
import time
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from collections import defaultdict
from ultralytics import YOLO
import numpy as np

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.detection import Detection, DetectionBatch
from shared.schemas.tracking import Track, TrackBatch, TrackState, BoundingBox
from shared.schemas.zone import Zone, ZoneConfig, ZoneType
from shared.utils.zones import load_zones_from_file

logger = logging.getLogger(__name__)


class Tracker:
    def __init__(self):
        self.tracks: Dict[int, Track] = {}
        self.next_id = 1
        self.max_age = settings.track_buffer
        self.min_hits = 3

    def update(self, detections: List[Detection], camera_id: str, frame_id: int, timestamp: datetime) -> Tuple[List[Track], List[int]]:
        matched_tracks = []
        unmatched_detections = list(range(len(detections)))
        unmatched_tracks = list(self.tracks.keys())

        if self.tracks and detections:
            iou_matrix = self._compute_iou_matrix(detections)
            matched_indices = self._hungarian_match(iou_matrix)

            for d_idx, t_idx in matched_indices:
                track_id = list(self.tracks.keys())[t_idx]
                track = self.tracks[track_id]
                det = detections[d_idx]

                track.bbox = det.bbox
                track.confidence = det.confidence
                track.class_id = det.class_id
                track.class_name = det.class_name
                track.state = TrackState.TRACKED
                track.hits += 1
                track.hit_streak += 1
                track.time_since_update = 0
                track.last_update = timestamp
                matched_tracks.append(track)

                unmatched_detections.remove(d_idx)
                unmatched_tracks.remove(track_id)

        for t_idx in unmatched_tracks:
            track_id = list(self.tracks.keys())[t_idx]
            track = self.tracks[track_id]
            track.time_since_update += 1
            track.hit_streak = 0

            if track.time_since_update > self.max_age:
                track.state = TrackState.REMOVED
            elif track.time_since_update > 0:
                track.state = TrackState.LOST

        for d_idx in unmatched_detections:
            det = detections[d_idx]
            track = Track(
                track_id=self.next_id,
                camera_id=camera_id,
                class_id=det.class_id,
                class_name=det.class_name,
                bbox=det.bbox,
                confidence=det.confidence,
                state=TrackState.NEW,
                start_time=timestamp,
                last_update=timestamp,
            )
            self.tracks[self.next_id] = track
            self.next_id += 1
            matched_tracks.append(track)

        removed_ids = [tid for tid, track in self.tracks.items() if track.state == TrackState.REMOVED]
        for tid in removed_ids:
            del self.tracks[tid]

        active_tracks = [t for t in matched_tracks if t.state != TrackState.REMOVED]
        return active_tracks, removed_ids

    def _compute_iou_matrix(self, detections: List[Detection]) -> np.ndarray:
        track_boxes = [t.bbox for t in self.tracks.values()]
        det_boxes = [d.bbox for d in detections]

        if not track_boxes or not det_boxes:
            return np.zeros((len(det_boxes), len(track_boxes)))

        iou_matrix = np.zeros((len(det_boxes), len(track_boxes)))
        for i, det_box in enumerate(det_boxes):
            for j, trk_box in enumerate(track_boxes):
                iou_matrix[i, j] = det_box.iou(trk_box)

        return iou_matrix

    def _hungarian_match(self, iou_matrix: np.ndarray, threshold: float = 0.3) -> List[Tuple[int, int]]:
        from scipy.optimize import linear_sum_assignment
        cost_matrix = -iou_matrix
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        matches = []
        for r, c in zip(row_ind, col_ind):
            if iou_matrix[r, c] >= threshold:
                matches.append((r, c))
        return matches


class TrackingService:
    def __init__(self, stream_manager: StreamManager):
        self.stream_manager = stream_manager
        self.trackers: Dict[str, Tracker] = defaultdict(Tracker)
        self.zones: Dict[str, List[Zone]] = {}
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "tracking_service"
        self._consumer_name = "tracker-1"

    async def start(self):
        await self._load_zones()
        await self.stream_manager.create_consumer_group(
            StreamManager.DETECTION_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        self._running = True

        # Combine cameras from zones and registered cameras
        camera_ids = set(self.zones.keys())
        from pathlib import Path
        cam_file = Path("./cameras.json")
        if not cam_file.exists():
            cam_file = Path(__file__).resolve().parent.parent.parent / "cameras.json"
        if cam_file.exists():
            try:
                with open(cam_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for item in data:
                    if isinstance(item, dict) and item.get("enabled", True):
                        cid = item.get("id") or item.get("camera_id")
                        if cid:
                            camera_ids.add(str(cid))
            except Exception:
                pass

        if not camera_ids:
            camera_ids = {"default", "cam1", "BOP-01"}

        for camera_id in sorted(list(camera_ids)):
            stream_name = self.stream_manager.stream_name(StreamManager.DETECTION_STREAM, camera_id)
            task = asyncio.create_task(self._process_stream(stream_name, camera_id))
            self._tasks.append(task)

        logger.info(f"Tracking Service started for {len(self._tasks)} camera streams: {sorted(list(camera_ids))}")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("Tracking Service stopped")

    async def _load_zones(self):
        try:
            zones = load_zones_from_file(settings.zones_config)
            for zone in zones:
                if zone.config.camera_id not in self.zones:
                    self.zones[zone.config.camera_id] = []
                self.zones[zone.config.camera_id].append(zone)
            logger.info(f"Loaded {len(zones)} zones for {len(self.zones)} cameras")
        except FileNotFoundError:
            logger.warning(f"Zones config not found: {settings.zones_config}")
        except Exception as e:
            logger.error(f"Failed to load zones: {e}")

    async def _process_stream(self, stream_name: str, camera_id: str):
        streams = {stream_name: "0"}
        tracker = self.trackers[camera_id]
        camera_zones = self.zones.get(camera_id, [])

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
                            batch_data = json.loads(data_str)
                            batch = DetectionBatch(**batch_data)

                            tracks, removed_ids = tracker.update(
                                batch.detections,
                                camera_id,
                                batch.frame_id,
                                batch.timestamp,
                            )

                            zone_events = self._check_zones(tracks, camera_zones)

                            track_batch = TrackBatch(
                                camera_id=camera_id,
                                frame_id=batch.frame_id,
                                timestamp=batch.timestamp,
                                tracks=tracks,
                                removed_tracks=removed_ids,
                            )

                            track_stream = self.stream_manager.stream_name(StreamManager.TRACK_STREAM, camera_id)
                            await self.stream_manager.add_track(track_stream, track_batch.model_dump())

                            for event in zone_events:
                                await self.stream_manager.add_event(
                                    StreamManager.EVENT_STREAM,
                                    event,
                                )

                            await self.stream_manager.ack(stream_name, self._consumer_group, msg_id)

                        except Exception as e:
                            logger.error(f"Error processing detection batch: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Tracking stream error: {e}")
                await asyncio.sleep(1)

    def _check_zones(self, tracks: List[Track], zones: List[Zone]) -> List[Dict]:
        events = []
        for track in tracks:
            cx, cy = track.center

            for zone in zones:
                if not zone.config.enabled:
                    continue

                if zone.config.classes and track.class_name not in zone.config.classes:
                    continue

                inside = zone.contains_point(cx, cy)
                was_inside = "inside" in track.metadata

                if inside and not was_inside:
                    track.metadata["inside"] = True
                    track.metadata["entry_time"] = track.last_update.timestamp()
                    events.append({
                        "type": "zone_entry",
                        "camera_id": track.camera_id,
                        "zone_id": zone.id,
                        "track_id": track.track_id,
                        "class_name": track.class_name,
                        "timestamp": track.last_update.isoformat(),
                        "message": f"{track.class_name} entered zone {zone.config.name}",
                    })

                elif not inside and was_inside:
                    del track.metadata["inside"]
                    entry_time = track.metadata.pop("entry_time", track.last_update.timestamp())
                    dwell = track.last_update.timestamp() - entry_time
                    events.append({
                        "type": "zone_exit",
                        "camera_id": track.camera_id,
                        "zone_id": zone.id,
                        "track_id": track.track_id,
                        "class_name": track.class_name,
                        "dwell_time": dwell,
                        "timestamp": track.last_update.isoformat(),
                        "message": f"{track.class_name} exited zone {zone.config.name} (dwell: {dwell:.1f}s)",
                    })

                if zone.config.type == ZoneType.LINE:
                    prev_pos = track.metadata.get("prev_center")
                    if prev_pos:
                        cross_dir = zone.line_crossed(prev_pos[0], prev_pos[1], cx, cy)
                        if cross_dir:
                            events.append({
                                "type": "line_cross",
                                "camera_id": track.camera_id,
                                "zone_id": zone.id,
                                "track_id": track.track_id,
                                "class_name": track.class_name,
                                "direction": cross_dir,
                                "timestamp": track.last_update.isoformat(),
                                "message": f"{track.class_name} crossed line {zone.config.name} ({cross_dir})",
                            })

                track.metadata["prev_center"] = (cx, cy)

        return events