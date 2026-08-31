from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, time

class ZoneBase(BaseModel):
    name: str
    camera_id: int
    zone_type: str
    coordinates: Any
    allowed_direction: Optional[str] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    alert_severity: Optional[str] = "high"
    is_active: Optional[bool] = True

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(ZoneBase):
    name: Optional[str] = None
    camera_id: Optional[int] = None
    zone_type: Optional[str] = None
    coordinates: Optional[Any] = None

class ZoneResponse(ZoneBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
