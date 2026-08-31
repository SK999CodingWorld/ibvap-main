import time
import numpy as np
from collections import defaultdict, deque
from typing import Dict, List, Tuple, Any, Optional

class BehaviorAnalyticsEngine:
    """
    Real-Time Temporal & Spatial Behavioral Analytics Engine
    Analyzes multi-frame position histories, aspect ratios, velocity vectors,
    and multi-agent interactions for:
      1. Loitering (Stationary in radius for > N seconds)
      2. Running / Sudden Sprinting (Velocity exceeds threshold)
      3. Fall Detection / Man Down (Aspect ratio flips tall -> wide + downward displacement)
      4. Fight / Physical Aggression (Converging person tracks + high variance erratic movement)
    """
    def __init__(self):
        # Track history buffers: track_id -> deque of (timestamp, cx, cy, width, height, (x1, y1, x2, y2))
        self.track_buffers = defaultdict(lambda: deque(maxlen=45))
        
        # Timers & State Trackers
        self.loitering_start_times: Dict[int, float] = {}
        self.fall_start_times: Dict[int, float] = {}
        self.last_behavior_alerts: Dict[str, float] = {}
        
        # Configurable Thresholds
        self.LOITER_RADIUS = 65.0       # pixels
        self.LOITER_MIN_SECONDS = 4.0   # seconds
        self.RUNNING_SPEED_THRESH = 18.0 # pixels per frame
        self.FALL_ASPECT_RATIO_THRESH = 0.85 # width > height
        self.FIGHT_PROXIMITY_THRESH = 80.0  # pixels between persons
        self.FIGHT_MOTION_VARIANCE_THRESH = 12.0

    def update_and_analyze(
        self,
        current_time: float,
        detected_persons: List[Dict[str, Any]]
    ) -> Tuple[Dict[int, Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Updates track history and computes behavioral anomalies.

        Args:
            current_time: Current timestamp in seconds
            detected_persons: List of dicts with {track_id, bbox: (x1, y1, x2, y2), conf}

        Returns:
            Tuple of:
              - per_person_behaviors: Dict[track_id -> {behavior_type, label, color, severity}]
              - triggered_alerts: List of alert dicts for live alert feed
        """
        active_ids = set()
        per_person_behaviors: Dict[int, Dict[str, Any]] = {}
        triggered_alerts: List[Dict[str, Any]] = []

        # 1. Update Position & Geometry Buffers
        for p in detected_persons:
            track_id = p["track_id"]
            x1, y1, x2, y2 = p["bbox"]
            w = x2 - x1
            h = y2 - y1
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            active_ids.add(track_id)
            self.track_buffers[track_id].append((current_time, cx, cy, w, h, (x1, y1, x2, y2)))

        # 2. Individual Behavior Analysis (Loitering, Running, Fall Detection)
        for track_id, history in self.track_buffers.items():
            if track_id not in active_ids or len(history) < 5:
                continue

            times, cxs, cys, ws, hs, bboxes = zip(*history)
            latest_t, latest_cx, latest_cy, latest_w, latest_h, latest_bbox = history[-1]
            dt = max(0.001, latest_t - times[0])
            aspect_ratio = latest_h / float(max(1, latest_w))

            # --- Rule A: Loitering Detection ---
            max_dist_from_origin = max(np.hypot(np.array(cxs) - cxs[0], np.array(cys) - cys[0]))
            if max_dist_from_origin <= self.LOITER_RADIUS:
                if track_id not in self.loitering_start_times:
                    self.loitering_start_times[track_id] = latest_t
                
                dwell_sec = latest_t - self.loitering_start_times[track_id]
                if dwell_sec >= self.LOITER_MIN_SECONDS:
                    behavior_info = {
                        "type": "LOITERING",
                        "label": f"LOITERING ({dwell_sec:.1f}s)",
                        "color": (0, 140, 255), # Amber
                        "severity": "MEDIUM" if dwell_sec < 8.0 else "HIGH"
                    }
                    per_person_behaviors[track_id] = behavior_info
                    
                    self._check_and_emit_alert(
                        alert_key=f"loiter_{track_id}",
                        current_time=latest_t,
                        cooldown=6.0,
                        alert_dict={
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "time": time.strftime("%H:%M:%S"),
                            "object_type": "BEHAVIOR_LOITERING",
                            "track_id": track_id,
                            "confidence": 92.0,
                            "severity": "HIGH" if dwell_sec >= 8.0 else "MEDIUM",
                            "type": f"⚠️ LOITERING DETECTED: Person #{track_id} stationary for {dwell_sec:.1f}s",
                            "zone": "Perimeter Surveillance",
                            "dwell_time": round(dwell_sec, 1)
                        },
                        triggered_alerts=triggered_alerts
                    )
            else:
                self.loitering_start_times.pop(track_id, None)

            # --- Rule B: Running / Sudden Movement Detection ---
            if len(history) >= 4:
                # Frame-to-frame displacement over last 4 frames
                speeds = [np.hypot(cxs[i] - cxs[i-1], cys[i] - cys[i-1]) for i in range(len(cxs)-3, len(cxs))]
                avg_speed = float(np.mean(speeds))
                
                if avg_speed >= self.RUNNING_SPEED_THRESH:
                    behavior_info = {
                        "type": "RUNNING",
                        "label": f"RUNNING / SPRINT (v:{avg_speed:.0f}px)",
                        "color": (0, 255, 255), # Bright Yellow/Cyan
                        "severity": "HIGH"
                    }
                    per_person_behaviors[track_id] = behavior_info
                    
                    self._check_and_emit_alert(
                        alert_key=f"running_{track_id}",
                        current_time=latest_t,
                        cooldown=4.0,
                        alert_dict={
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "time": time.strftime("%H:%M:%S"),
                            "object_type": "BEHAVIOR_RUNNING",
                            "track_id": track_id,
                            "confidence": 95.0,
                            "severity": "HIGH",
                            "type": f"⚡ SUDDEN SPRINT / RUNNING: Person #{track_id} (Speed: {avg_speed:.1f}px/f)",
                            "zone": "Perimeter Surveillance",
                            "dwell_time": 0.0
                        },
                        triggered_alerts=triggered_alerts
                    )

            # --- Rule C: Fall Detection / Man Down ---
            # Normal upright person: aspect_ratio >= 1.4. Fall: aspect_ratio <= 0.85
            past_aspect_ratios = [hs[i] / float(max(1, ws[i])) for i in range(min(5, len(hs)))]
            was_upright = any(ar >= 1.35 for ar in past_aspect_ratios)
            is_now_horizontal = aspect_ratio <= self.FALL_ASPECT_RATIO_THRESH

            if was_upright and is_now_horizontal:
                if track_id not in self.fall_start_times:
                    self.fall_start_times[track_id] = latest_t
                
                fall_duration = latest_t - self.fall_start_times[track_id]
                if fall_duration >= 1.2:
                    behavior_info = {
                        "type": "FALL_DETECTED",
                        "label": "🚨 FALL DETECTED (MAN DOWN)",
                        "color": (255, 0, 128), # Deep Pink / Magenta
                        "severity": "CRITICAL"
                    }
                    per_person_behaviors[track_id] = behavior_info
                    
                    self._check_and_emit_alert(
                        alert_key=f"fall_{track_id}",
                        current_time=latest_t,
                        cooldown=5.0,
                        alert_dict={
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "time": time.strftime("%H:%M:%S"),
                            "object_type": "BEHAVIOR_FALL",
                            "track_id": track_id,
                            "confidence": 96.5,
                            "severity": "CRITICAL",
                            "type": f"🚨 EMERGENCY: Fall Detected / Person #{track_id} Down!",
                            "zone": "Sector 4 Red Perimeter",
                            "dwell_time": round(fall_duration, 1)
                        },
                        triggered_alerts=triggered_alerts
                    )
            else:
                self.fall_start_times.pop(track_id, None)

        # 3. Multi-Agent Interaction Analysis: Fight / Physical Aggression
        person_ids = list(active_ids)
        for i in range(len(person_ids)):
            for j in range(i + 1, len(person_ids)):
                id1, id2 = person_ids[i], person_ids[j]
                h1, h2 = self.track_buffers[id1], self.track_buffers[id2]
                if len(h1) < 5 or len(h2) < 5:
                    continue

                pos1 = (h1[-1][1], h1[-1][2])
                pos2 = (h2[-1][1], h2[-1][2])
                dist = np.hypot(pos1[0] - pos2[0], pos1[1] - pos2[1])

                # Check proximity & bounding box interaction
                if dist <= self.FIGHT_PROXIMITY_THRESH:
                    # Measure motion erraticness (variance of velocities)
                    v1 = [np.hypot(h1[k][1] - h1[k-1][1], h1[k][2] - h1[k-1][2]) for k in range(1, len(h1))]
                    v2 = [np.hypot(h2[k][1] - h2[k-1][1], h2[k][2] - h2[k-1][2]) for k in range(1, len(h2))]
                    motion_energy = np.std(v1) + np.std(v2)

                    if motion_energy >= self.FIGHT_MOTION_VARIANCE_THRESH:
                        behavior_fight = {
                            "type": "FIGHT_AGGRESSION",
                            "label": f"⚔️ AGGRESSION / FIGHT (#{id1} + #{id2})",
                            "color": (0, 0, 255), # Crimson Red
                            "severity": "CRITICAL"
                        }
                        per_person_behaviors[id1] = behavior_fight
                        per_person_behaviors[id2] = behavior_fight

                        self._check_and_emit_alert(
                            alert_key=f"fight_{min(id1, id2)}_{max(id1, id2)}",
                            current_time=current_time,
                            cooldown=5.0,
                            alert_dict={
                                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                "time": time.strftime("%H:%M:%S"),
                                "object_type": "BEHAVIOR_FIGHT",
                                "track_id": id1,
                                "confidence": 94.0,
                                "severity": "CRITICAL",
                                "type": f"⚔️ PHYSICAL ALTERCATION: Fight detected between Persons #{id1} and #{id2}",
                                "zone": "Public Access Zone",
                                "dwell_time": 0.0
                            },
                            triggered_alerts=triggered_alerts
                        )

        # 4. Clean up stale track histories
        stale = [t for t in list(self.track_buffers.keys()) if t not in active_ids]
        for s in stale:
            del self.track_buffers[s]
            self.loitering_start_times.pop(s, None)
            self.fall_start_times.pop(s, None)

        return per_person_behaviors, triggered_alerts

    def _check_and_emit_alert(
        self,
        alert_key: str,
        current_time: float,
        cooldown: float,
        alert_dict: Dict[str, Any],
        triggered_alerts: List[Dict[str, Any]]
    ):
        last_time = self.last_behavior_alerts.get(alert_key, 0.0)
        if current_time - last_time >= cooldown:
            self.last_behavior_alerts[alert_key] = current_time
            triggered_alerts.append(alert_dict)

behavior_engine = BehaviorAnalyticsEngine()
