import os
import cv2
import time
import sqlite3
import json
import threading
import uuid
import numpy as np
from typing import Dict, List, Optional, Any, Tuple

class EvidenceVaultManager:
    """
    Security Evidence & Case Management Audit Vault
    Automatically captures, indexes, and logs high-resolution cropped snapshots
    and forensic metadata for all security alerts and anomalies into SQLite.
    """
    def __init__(self, db_path: Optional[str] = None, storage_dir: Optional[str] = None):
        self.lock = threading.Lock()
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        if db_path is None:
            db_path = os.path.join(base_dir, "security_evidence_cases.db")
        if storage_dir is None:
            storage_dir = os.path.join(base_dir, "evidence_snapshots")
            
        self.db_path = db_path
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        
        self._init_db()

    def _init_db(self):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS evidence_cases (
                    id TEXT PRIMARY KEY,
                    case_number TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    camera_id TEXT NOT NULL,
                    object_class TEXT NOT NULL,
                    track_id INTEGER NOT NULL,
                    snapshot_filename TEXT NOT NULL,
                    snapshot_url TEXT NOT NULL,
                    zone_name TEXT NOT NULL,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    speed_kmh REAL,
                    confidence REAL,
                    status TEXT DEFAULT 'PENDING_REVIEW',
                    metadata_json TEXT,
                    created_at REAL
                )
            """)
            conn.commit()
            conn.close()

    def log_case(
        self,
        frame: np.ndarray,
        bbox: Optional[Tuple[int, int, int, int]],
        camera_id: str,
        object_class: str,
        track_id: int,
        alert_type: str,
        severity: str,
        zone_name: str = "Sector 4 Red Perimeter",
        speed_kmh: Optional[float] = None,
        confidence: float = 95.0,
        extra_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Crops target snapshot from the raw video frame, saves to disk,
        and registers a new forensic Case Record in SQLite.
        """
        case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
        case_num = f"INC-{time.strftime('%Y%m%d')}-{track_id:04d}"
        filename = f"{case_id}_{int(time.time())}.jpg"
        filepath = os.path.join(self.storage_dir, filename)
        snapshot_url = f"/api/evidence/snapshot/{filename}"

        # Crop target object from frame if bbox provided, else save full frame
        if frame is not None and frame.size > 0:
            if bbox is not None:
                x1, y1, x2, y2 = bbox
                h, w = frame.shape[:2]
                # Add 15% margin for contextual evidence review
                pad_x = int((x2 - x1) * 0.15)
                pad_y = int((y2 - y1) * 0.15)
                cx1, cy1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
                cx2, cy2 = min(w, x2 + pad_x), min(h, y2 + pad_y)
                crop = frame[cy1:cy2, cx1:cx2]
            else:
                crop = frame
            try:
                cv2.imwrite(filepath, crop)
            except Exception:
                pass
        else:
            # Fallback blank placeholder
            blank = np.zeros((180, 240, 3), dtype=np.uint8)
            cv2.putText(blank, case_id, (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.imwrite(filepath, blank)

        time_str = time.strftime("%Y-%m-%d %H:%M:%S")
        created_at = time.time()
        meta_str = json.dumps(extra_metadata or {})

        record = {
            "id": case_id,
            "case_number": case_num,
            "timestamp": time_str,
            "camera_id": camera_id,
            "object_class": object_class.upper(),
            "track_id": int(track_id),
            "snapshot_filename": filename,
            "snapshot_url": snapshot_url,
            "zone_name": zone_name,
            "alert_type": alert_type,
            "severity": severity,
            "speed_kmh": speed_kmh,
            "confidence": round(confidence, 1),
            "status": "PENDING_REVIEW",
            "metadata_json": meta_str,
            "created_at": created_at
        }

        with self.lock:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO evidence_cases (
                        id, case_number, timestamp, camera_id, object_class, track_id,
                        snapshot_filename, snapshot_url, zone_name, alert_type, severity,
                        speed_kmh, confidence, status, metadata_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    case_id, case_num, time_str, camera_id, object_class.upper(), int(track_id),
                    filename, snapshot_url, zone_name, alert_type, severity,
                    speed_kmh, confidence, "PENDING_REVIEW", meta_str, created_at
                ))
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[Evidence Vault] Error inserting case: {e}")

        return record

    def search_cases(
        self,
        query: Optional[str] = None,
        object_type: Optional[str] = None,
        alert_type: Optional[str] = None,
        severity: Optional[str] = None,
        camera_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Queries and filters forensic evidence cases with search parameters"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            sql = "SELECT * FROM evidence_cases WHERE 1=1"
            params = []

            if query:
                sql += " AND (id LIKE ? OR case_number LIKE ? OR alert_type LIKE ? OR zone_name LIKE ?)"
                q_param = f"%{query}%"
                params.extend([q_param, q_param, q_param, q_param])
            if object_type and object_type.lower() != "all":
                sql += " AND object_class LIKE ?"
                params.append(f"%{object_type}%")
            if alert_type and alert_type.lower() != "all":
                sql += " AND alert_type LIKE ?"
                params.append(f"%{alert_type}%")
            if severity and severity.lower() != "all":
                sql += " AND severity = ?"
                params.append(severity.upper())
            if camera_id and camera_id.lower() != "all":
                sql += " AND camera_id = ?"
                params.append(camera_id)

            sql += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()
            cases = [dict(r) for r in rows]
            conn.close()
            return cases

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*), COUNT(DISTINCT object_class), COUNT(DISTINCT alert_type) FROM evidence_cases")
            total_cases, unique_objects, unique_types = cursor.fetchone()
            
            cursor.execute("SELECT severity, COUNT(*) FROM evidence_cases GROUP BY severity")
            sev_counts = dict(cursor.fetchall())
            conn.close()
            
            return {
                "total_cases": total_cases or 0,
                "critical_cases": sev_counts.get("CRITICAL", 0),
                "high_cases": sev_counts.get("HIGH", 0),
                "medium_cases": sev_counts.get("MEDIUM", 0),
                "unique_objects": unique_objects or 0,
                "status": "SECURED_IMMUTABLE"
            }

evidence_vault = EvidenceVaultManager()
