from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Time
from sqlalchemy.sql import func
from app.core.database import Base

class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    zone_type = Column(String) # polygon/rectangle/line
    coordinates = Column(JSON)
    allowed_direction = Column(String, nullable=True)
    time_start = Column(Time, nullable=True)
    time_end = Column(Time, nullable=True)
    alert_severity = Column(String, default="high")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
