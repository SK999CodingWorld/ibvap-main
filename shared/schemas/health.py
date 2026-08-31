from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    STARTING = "starting"
    STOPPING = "stopping"


class ComponentHealth(BaseModel):
    name: str
    status: ServiceStatus
    message: Optional[str] = None
    latency_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    last_check: datetime = Field(default_factory=datetime.utcnow)


class HealthCheck(BaseModel):
    service: str
    version: str
    status: ServiceStatus
    uptime_seconds: float
    components: List[ComponentHealth] = Field(default_factory=list)
    timestamp: datetime


class ServiceInfo(BaseModel):
    name: str
    version: str
    description: str
    endpoints: List[str]
    dependencies: List[str]