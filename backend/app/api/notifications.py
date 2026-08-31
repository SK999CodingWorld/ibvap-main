from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from app.api.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Mock notifications
MOCK_NOTIFICATIONS = [
    {
        "id": str(uuid.uuid4()),
        "type": "alert",
        "title": "Intrusion Detected",
        "message": "Person detected in restricted zone Z-03",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "read": False,
        "priority": "high",
        "link": "/incidents"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "system",
        "title": "Edge Node Offline",
        "message": "EDGE-005 disconnected from central server",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(),
        "read": False,
        "priority": "critical",
        "link": "/edge"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "anpr",
        "title": "Watchlist Vehicle",
        "message": "Watchlist plate MH12AB1234 detected on CAM-012",
        "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "read": True,
        "priority": "high",
        "link": "/anpr"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "system",
        "title": "Daily Report Ready",
        "message": "Analytics report for yesterday is ready",
        "timestamp": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        "read": True,
        "priority": "low",
        "link": "/analytics"
    }
]

@router.get("")
async def get_notifications(unread_only: bool = False, current_user=Depends(get_current_user)):
    if unread_only:
        return [n for n in MOCK_NOTIFICATIONS if not n["read"]]
    return MOCK_NOTIFICATIONS

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user=Depends(get_current_user)):
    for notif in MOCK_NOTIFICATIONS:
        if notif["id"] == notification_id:
            notif["read"] = True
            return {"status": "success", "notification": notif}
    raise HTTPException(status_code=404, detail="Notification not found")

@router.post("/read-all")
async def mark_all_as_read(current_user=Depends(get_current_user)):
    for notif in MOCK_NOTIFICATIONS:
        notif["read"] = True
    return {"status": "success", "updated": len(MOCK_NOTIFICATIONS)}

@router.get("/unread-count")
async def get_unread_count(current_user=Depends(get_current_user)):
    count = sum(1 for n in MOCK_NOTIFICATIONS if not n["read"])
    return {"count": count}
