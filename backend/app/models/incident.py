from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True) # INC-0001
    severity = Column(String)
    status = Column(String, default="detected") # detected/verified/assigned/investigating/resolved
    camera_ids = Column(JSON)
    location = Column(String)
    trigger = Column(String)
    risk_score = Column(Float)
    evidence_ids = Column(JSON)
    related_alert_ids = Column(JSON)
    related_tracking_ids = Column(JSON)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(JSON) # list of notes
    timeline = Column(JSON) # list of timeline events
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
