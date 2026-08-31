from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    CAMERA_CONNECTED = "camera_connected"
    CAMERA_DISCONNECTED = "camera_disconnected"
    CAMERA_ERROR = "camera_error"
    ZONE_ENTRY = "zone_entry"
    ZONE_EXIT = "zone_exit"
    LINE_CROSS = "line_cross"
    TRACK_START = "track_start"
    TRACK_END = "track_end"
    TRACK_LOST = "track_lost"
    ALERT_TRIGGERED = "alert_triggered"
    ALERT_ACKNOWLEDGED = "alert_acknowledged"
    FACE_ENROLLED = "face_enrolled"
    FACE_MATCHED = "face_matched"
    PLATE_DETECTED = "plate_detected"
    PLATE_MATCHED = "plate_matched"
    RECORDING_START = "recording_start"
    RECORDING_END = "recording_end"
    MODEL_LOADED = "model_loaded"
    MODEL_ERROR = "model_error"


class Event(BaseModel):
    id: str
    type: EventType
    camera_id: Optional[str] = None
    zone_id: Optional[str] = None
    track_id: Optional[int] = None
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
    source: str = "ibvap"


class EventFilter(BaseModel):
    camera_ids: Optional[List[str]] = None
    zone_ids: Optional[List[str]] = None
    event_types: Optional[List[EventType]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = 100
    offset: int = 0