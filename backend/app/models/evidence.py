from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String, unique=True, index=True)
    type = Column(String) # snapshot/video_clip/metadata
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    file_path = Column(String)
    sha256_hash = Column(String)
    metadata_json = Column(JSON)
    integrity_verified = Column(Boolean, default=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
