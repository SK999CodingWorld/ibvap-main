from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class DetectionResponse(BaseModel):
    id: int
    camera_id: int
    object_type: str
    tracking_id: Optional[str]
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    direction: Optional[str]
    speed: Optional[float]
    zone: Optional[str]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class TrackResponse(BaseModel):
    id: int
    tracking_id: str
    object_type: str
    first_seen: datetime
    last_seen: datetime
    cameras: Any
    path: Any
    zone_transitions: Any
    status: str

    model_config = ConfigDict(from_attributes=True)

class ANPRReadResponse(BaseModel):
    id: int
    camera_id: int
    plate_number: str
    vehicle_type: Optional[str]
    confidence: float
    plate_image_path: Optional[str]
    vehicle_image_path: Optional[str]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
