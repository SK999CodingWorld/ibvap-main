from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    object_type = Column(String) # person/vehicle/face/unknown
    tracking_id = Column(String, index=True) # P-104 etc
    confidence = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)
    direction = Column(String)
    speed = Column(Float)
    zone = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Track(Base):
    __tablename__ = "tracks"
    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String, unique=True, index=True)
    object_type = Column(String)
    first_seen = Column(DateTime(timezone=True))
    last_seen = Column(DateTime(timezone=True))
    cameras = Column(JSON) # JSON list
    path = Column(JSON)
    zone_transitions = Column(JSON)
    status = Column(String)

class ANPRRead(Base):
    __tablename__ = "anpr_reads"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    plate_number = Column(String, index=True)
    vehicle_type = Column(String)
    confidence = Column(Float)
    plate_image_path = Column(String)
    vehicle_image_path = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
