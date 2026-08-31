from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class AlertBase(BaseModel):
    severity: str
    type: str
    camera_id: int
    object_type: Optional[str] = None
    tracking_id: Optional[str] = None
    confidence: Optional[float] = None
    risk_score: Optional[float] = None
    risk_factors: Optional[Any] = None
    status: Optional[str] = "new"
    assigned_to: Optional[int] = None

class AlertCreate(AlertBase):
    alert_id: str

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None

class AlertResponse(AlertBase):
    id: int
    alert_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
