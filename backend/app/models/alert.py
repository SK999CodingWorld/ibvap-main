from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True) # ALT-0001
    severity = Column(String) # critical/high/medium/low/info
    type = Column(String) # zone_intrusion/loitering/night_movement/anpr_alert/camera_tamper/network_failure etc
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    object_type = Column(String)
    tracking_id = Column(String)
    confidence = Column(Float)
    risk_score = Column(Float)
    risk_factors = Column(JSON)
    status = Column(String, default="new") # new/acknowledged/investigating/escalated/resolved/false_positive
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
