import time
import numpy as np
from typing import Dict, List, Tuple, Any, Optional

class TrackMotionInterpolator:
    """
    High-Performance Kinematic & Kalman Motion Prediction Engine
    Interpolates and projects object bounding boxes on skipped frames
    between deep neural network detection cycles.
    """
    def __init__(self):
        # track_id -> { "box": (x1, y1, x2, y2), "vx": float, "vy": float, "last_t": float, "class_name": str, "conf": float }
        self.track_states: Dict[int, Dict[str, Any]] = {}

    def update_detected_tracks(
        self,
        tracked_objects: List[Any],
        current_time: float
    ):
        """
        Updates kinematic state vectors (velocity and position) on full detection frames.
        """
        active_ids = set()
        for obj in tracked_objects:
            x1, y1, x2, y2, track_id, class_name, conf = obj
            track_id = int(track_id)
            active_ids.add(track_id)

            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0

            if track_id in self.track_states:
                prev = self.track_states[track_id]
                dt = max(0.001, current_time - prev["last_t"])
                prev_cx = (prev["box"][0] + prev["box"][2]) / 2.0
                prev_cy = (prev["box"][1] + prev["box"][3]) / 2.0
                
                # Instantaneous velocity (pixels/second) with exponential dampening
                inst_vx = (cx - prev_cx) / dt
                inst_vy = (cy - prev_cy) / dt
                vx = 0.70 * prev.get("vx", inst_vx) + 0.30 * inst_vx
                vy = 0.70 * prev.get("vy", inst_vy) + 0.30 * inst_vy
            else:
                vx, vy = 0.0, 0.0

            self.track_states[track_id] = {
                "box": [float(x1), float(y1), float(x2), float(y2)],
                "vx": vx,
                "vy": vy,
                "last_t": current_time,
                "class_name": class_name,
                "conf": float(conf)
            }

        # Purge stale tracks not detected for over 1.5 seconds
        stale = [t for t, s in self.track_states.items() if current_time - s["last_t"] > 1.5]
        for s in stale:
            del self.track_states[s]

    def interpolate_skipped_frame(
        self,
        current_time: float,
        frame_shape: Tuple[int, int]
    ) -> List[List[Any]]:
        """
        Projects bounding boxes forward in time using kinematic velocity vectors.
        """
        h, w = frame_shape[:2]
        interpolated = []

        for track_id, state in self.track_states.items():
            dt = max(0.0, current_time - state["last_t"])
            # Decay velocity slightly on skipped frames to avoid overshoot
            decay = max(0.0, 1.0 - (dt * 0.5))
            dx = state["vx"] * dt * decay
            dy = state["vy"] * dt * decay

            x1, y1, x2, y2 = state["box"]
            pred_x1 = max(0, min(w - 10, int(x1 + dx)))
            pred_y1 = max(0, min(h - 10, int(y1 + dy)))
            pred_x2 = max(pred_x1 + 10, min(w, int(x2 + dx)))
            pred_y2 = max(pred_y1 + 10, min(h, int(y2 + dy)))

            interpolated.append([
                pred_x1, pred_y1, pred_x2, pred_y2,
                track_id, state["class_name"], state["conf"]
            ])

        return interpolated

motion_interpolator = TrackMotionInterpolator()
