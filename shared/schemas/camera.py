from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CameraStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    CONNECTING = "connecting"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class CameraProtocol(str, Enum):
    RTSP = "rtsp"
    HTTP = "http"
    HTTPS = "https"
    RTMP = "rtmp"
    HLS = "hls"
    WEBSOCKET = "ws"


class PTZPreset(BaseModel):
    name: str
    pan: float
    tilt: float
    zoom: float


class CameraBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    protocol: CameraProtocol = CameraProtocol.RTSP
    stream_url: str = Field(..., description="RTSP/HTTP stream URL")
    username: Optional[str] = None
    password: Optional[str] = None
    rtsp_transport: str = "tcp"
    enabled: bool = True
    zones: List[str] = Field(default_factory=list, description="Zone IDs this camera monitors")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    ptz_enabled: bool = False
    ptz_presets: List[PTZPreset] = Field(default_factory=list)


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    stream_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    rtsp_transport: Optional[str] = None
    enabled: Optional[bool] = None
    zones: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    ptz_enabled: Optional[bool] = None
    ptz_presets: Optional[List[PTZPreset]] = None


class Camera(CameraBase):
    id: str
    status: CameraStatus = CameraStatus.OFFLINE
    last_seen: Optional[datetime] = None
    error_message: Optional[str] = None
    fps: float = 0.0
    bitrate: int = 0
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CameraHealth(BaseModel):
    camera_id: str
    status: CameraStatus
    last_frame_time: Optional[datetime] = None
    fps: float
    latency_ms: float
    error_count: int = 0
    last_error: Optional[str] = None