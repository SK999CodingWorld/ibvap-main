from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

class IncidentBase(BaseModel):
    severity: str
    status: Optional[str] = "detected"
    camera_ids: Optional[List[int]] = None
    location: Optional[str] = None
    trigger: Optional[str] = None
    risk_score: Optional[float] = None
    evidence_ids: Optional[List[int]] = None
    related_alert_ids: Optional[List[int]] = None
    related_tracking_ids: Optional[List[str]] = None
    assigned_to: Optional[int] = None
    notes: Optional[List[Any]] = None
    timeline: Optional[List[Any]] = None

class IncidentCreate(IncidentBase):
    incident_id: str

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[int] = None
    notes: Optional[List[Any]] = None
    timeline: Optional[List[Any]] = None

class IncidentResponse(IncidentBase):
    id: int
    incident_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
