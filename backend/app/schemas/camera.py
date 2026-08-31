from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class CameraBase(BaseModel):
    camera_id: str
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rtsp_url: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    camera_type: Optional[str] = None
    zone: Optional[str] = None
    status: Optional[str] = "offline"
    night_vision: Optional[bool] = False
    onvif_support: Optional[bool] = False

class CameraCreate(CameraBase):
    pass

class CameraUpdate(CameraBase):
    camera_id: Optional[str] = None
    name: Optional[str] = None

class CameraResponse(CameraBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CameraHealthResponse(BaseModel):
    id: int
    camera_id: int
    stream_status: Optional[str] = None
    fps_actual: Optional[float] = None
    latency_ms: Optional[int] = None
    signal_quality: Optional[int] = None
    ai_status: Optional[str] = None
    health_score: Optional[int] = None
    issues: Optional[Any] = None
    timestamp: datetime

    class Config:
        from_attributes = True
