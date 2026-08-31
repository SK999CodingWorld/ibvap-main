from pydantic import BaseModel

class DashboardKPIs(BaseModel):
    cameras_online: int
    cameras_offline: int
    active_alerts: int
    critical_incidents: int
    people_detected: int
    vehicles_detected: int
    anpr_reads: int
    restricted_zone_events: int
    system_health_score: float
    ai_processing_fps: float
