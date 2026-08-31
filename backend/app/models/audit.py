from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String)
    action = Column(String) # login/logout/camera_change/zone_change/evidence_access/incident_change/user_change/config_change/export
    resource_type = Column(String)
    resource_id = Column(String)
    details = Column(String)
    ip_address = Column(String)
    result = Column(String) # success/failure
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
