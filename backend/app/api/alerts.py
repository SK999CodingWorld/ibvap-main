from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

# Mock dependencies
async def get_current_user():
    return {"id": 1, "username": "admin"}

@router.get("")
async def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    camera_id: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    # Mock data
    return [
        {
            "id": "ALT-0001",
            "camera_id": "CAM-01",
            "object_type": "person",
            "tracking_id": "TRK-001",
            "risk_score": 87,
            "severity": "CRITICAL",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "NEW",
            "type": "Zone Intrusion"
        },
        {
            "id": "ALT-0002",
            "camera_id": "CAM-02",
            "object_type": "vehicle",
            "tracking_id": "TRK-002",
            "risk_score": 45,
            "severity": "MEDIUM",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "ACKNOWLEDGED",
            "type": "High Speed"
        }
    ]

@router.get("/{alert_id}")
async def get_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    return {
        "id": alert_id,
        "camera_id": "CAM-01",
        "object_type": "person",
        "tracking_id": "TRK-001",
        "risk_score": 87,
        "severity": "CRITICAL",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "NEW",
        "type": "Zone Intrusion",
        "factors": [
            {"name": "Restricted zone", "score": 30, "description": "Object in restricted zone", "category": "zone"},
            {"name": "Restricted hours", "score": 20, "description": "Night time detection", "category": "time"},
            {"name": "Movement toward protected", "score": 15, "description": "Moving to base", "category": "behavior"},
            {"name": "Loitering", "score": 12, "description": "Loitering > 30s", "category": "behavior"},
            {"name": "Multi object correlation", "score": 10, "description": "Multiple objects", "category": "correlation"}
        ]
    }

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    return {"id": alert_id, "status": "ACKNOWLEDGED"}

@router.post("/{alert_id}/escalate")
async def escalate_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    return {"id": alert_id, "status": "ESCALATED"}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, resolution: Dict[str, str], current_user: dict = Depends(get_current_user)):
    return {"id": alert_id, "status": "RESOLVED", "resolution": resolution.get("note", "")}

@router.post("/{alert_id}/false-positive")
async def mark_false_positive(alert_id: str, current_user: dict = Depends(get_current_user)):
    return {"id": alert_id, "status": "FALSE_POSITIVE"}

@router.get("/stats/summary")
async def get_alert_stats(current_user: dict = Depends(get_current_user)):
    return {
        "total": 120,
        "critical": 5,
        "high": 15,
        "medium": 40,
        "low": 60,
        "open": 25,
        "resolved": 95
    }

@router.post("/{alert_id}/incident")
async def create_incident_from_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    return {"incident_id": "INC-0001", "alert_id": alert_id, "status": "Created"}
