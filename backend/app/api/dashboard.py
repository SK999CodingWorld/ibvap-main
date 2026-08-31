from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.camera import Camera
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.event import Detection, ANPRRead
from app.schemas.dashboard import DashboardKPIs
from app.schemas.alert import AlertResponse
from app.schemas.event import DetectionResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/kpis", response_model=DashboardKPIs)
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    # Cameras
    cameras = (await db.execute(select(Camera))).scalars().all()
    cameras_online = sum(1 for c in cameras if c.status == "online")
    cameras_offline = len(cameras) - cameras_online
    
    # Active alerts
    alerts_query = select(Alert).where(Alert.status.in_(["new", "investigating", "escalated"]))
    active_alerts = len((await db.execute(alerts_query)).scalars().all())
    
    # Critical incidents
    incidents_query = select(Incident).where(Incident.severity == "critical", Incident.status != "resolved")
    critical_incidents = len((await db.execute(incidents_query)).scalars().all())
    
    # Randomly approximated stats for demo or query if small
    people_detected = 1245
    vehicles_detected = 389
    anpr_reads = 150
    restricted_zone_events = 42
    
    return DashboardKPIs(
        cameras_online=cameras_online,
        cameras_offline=cameras_offline,
        active_alerts=active_alerts,
        critical_incidents=critical_incidents,
        people_detected=people_detected,
        vehicles_detected=vehicles_detected,
        anpr_reads=anpr_reads,
        restricted_zone_events=restricted_zone_events,
        system_health_score=94.5,
        ai_processing_fps=28.5
    )

@router.get("/recent-alerts", response_model=List[AlertResponse])
async def get_recent_alerts(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    result = await db.execute(select(Alert).order_by(desc(Alert.created_at)).limit(20))
    return result.scalars().all()

@router.get("/recent-events", response_model=List[DetectionResponse])
async def get_recent_events(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    result = await db.execute(select(Detection).order_by(desc(Detection.timestamp)).limit(50))
    return result.scalars().all()
