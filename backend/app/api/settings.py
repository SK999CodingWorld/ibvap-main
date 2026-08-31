from fastapi import APIRouter, Depends, Body
from typing import Dict, Any
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Mock store for settings
MOCK_SETTINGS = {
    "general": {
        "system_name": "IBVAP Command Center",
        "timezone": "Asia/Kolkata",
        "theme": "dark",
        "data_retention_days": 90
    },
    "ai": {
        "min_confidence_detection": 0.65,
        "min_confidence_face": 0.85,
        "min_confidence_anpr": 0.80,
        "enable_gpu_acceleration": True,
        "max_concurrent_streams": 64
    },
    "notifications": {
        "email_alerts": True,
        "sms_alerts": False,
        "push_notifications": True,
        "alert_frequency": "immediate"
    },
    "thresholds": {
        "loitering_seconds": 60,
        "crowd_density_high": 15,
        "unattended_bag_seconds": 120,
        "speed_limit_kmh": 40
    }
}

@router.get("")
async def get_all_settings(current_user=Depends(get_current_user)):
    return MOCK_SETTINGS

@router.put("")
async def update_settings(settings: Dict[str, Any] = Body(...), current_user=Depends(get_current_user)):
    for section, data in settings.items():
        if section in MOCK_SETTINGS:
            MOCK_SETTINGS[section].update(data)
    return MOCK_SETTINGS

@router.get("/ai")
async def get_ai_settings(current_user=Depends(get_current_user)):
    return MOCK_SETTINGS["ai"]

@router.put("/ai")
async def update_ai_settings(settings: Dict[str, Any] = Body(...), current_user=Depends(get_current_user)):
    MOCK_SETTINGS["ai"].update(settings)
    return MOCK_SETTINGS["ai"]

@router.get("/notifications")
async def get_notification_settings(current_user=Depends(get_current_user)):
    return MOCK_SETTINGS["notifications"]

@router.put("/notifications")
async def update_notification_settings(settings: Dict[str, Any] = Body(...), current_user=Depends(get_current_user)):
    MOCK_SETTINGS["notifications"].update(settings)
    return MOCK_SETTINGS["notifications"]

@router.get("/thresholds")
async def get_thresholds(current_user=Depends(get_current_user)):
    return MOCK_SETTINGS["thresholds"]

@router.put("/thresholds")
async def update_thresholds(settings: Dict[str, Any] = Body(...), current_user=Depends(get_current_user)):
    MOCK_SETTINGS["thresholds"].update(settings)
    return MOCK_SETTINGS["thresholds"]
