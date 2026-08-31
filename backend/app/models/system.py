from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class EdgeNode(Base):
    __tablename__ = "edge_nodes"
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True)
    status = Column(String) # online/degraded/offline
    network_status = Column(String)
    ai_status = Column(String)
    pending_sync_count = Column(Integer, default=0)
    last_sync = Column(DateTime(timezone=True))
    metrics = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    id = Column(Integer, primary_key=True, index=True)
    metric_type = Column(String)
    value = Column(Float)
    unit = Column(String)
    status = Column(String) # healthy/degraded/critical
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String) # critical/high/medium/system/camera/security
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
