from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    INTRUSION = "intrusion"
    LINE_CROSSING = "line_crossing"
    LOITERING = "loitering"
    DWELL = "dwell"
    FACE_MATCH = "face_match"
    PLATE_MATCH = "plate_match"
    ANPR_DETECTED = "anpr_detected"
    FACE_DETECTED = "face_detected"
    BEHAVIOR_ANOMALY = "behavior_anomaly"
    CAMERA_OFFLINE = "camera_offline"
    CAMERA_ONLINE = "camera_online"
    SYSTEM_ERROR = "system_error"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Alert(BaseModel):
    id: str
    camera_id: str
    zone_id: Optional[str] = None
    track_id: Optional[int] = None
    type: AlertType
    severity: AlertSeverity = AlertSeverity.WARNING
    message: str
    class_name: Optional[str] = None
    confidence: Optional[float] = None
    bbox: Optional[List[float]] = None
    plate_text: Optional[str] = None
    face_match_id: Optional[str] = None
    face_distance: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class AlertRule(BaseModel):
    id: str
    name: str
    enabled: bool = True
    camera_ids: List[str] = Field(default_factory=list)
    zone_ids: List[str] = Field(default_factory=list)
    class_filters: List[str] = Field(default_factory=list)
    alert_types: List[AlertType] = Field(default_factory=list)
    min_confidence: float = 0.0
    cooldown_seconds: float = 5.0
    severity: AlertSeverity = AlertSeverity.WARNING
    notify_webhook: Optional[str] = None
    notify_email: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AlertSummary(BaseModel):
    total: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    by_camera: Dict[str, int]
    unacknowledged: int