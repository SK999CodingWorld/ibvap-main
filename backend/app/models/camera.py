from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String, unique=True, index=True, nullable=False)  # BOP-01
    name = Column(String, nullable=False)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    rtsp_url = Column(String)
    resolution = Column(String)
    fps = Column(Integer)
    camera_type = Column(String)
    zone = Column(String)
    status = Column(String, default="offline") # online/offline/connecting/degraded/no_signal/tampered/frozen
    night_vision = Column(Boolean, default=False)
    onvif_support = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CameraHealth(Base):
    __tablename__ = "camera_health"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    stream_status = Column(String)
    fps_actual = Column(Float)
    latency_ms = Column(Integer)
    signal_quality = Column(Integer)
    ai_status = Column(String)
    health_score = Column(Integer)
    issues = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
