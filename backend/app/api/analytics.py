from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.api.auth import get_current_user
import random

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/surveillance")
async def get_surveillance_analytics(current_user=Depends(get_current_user)):
    hours = [f"{i:02d}:00" for i in range(24)]
    return {
        "timeline": [
            {
                "time": hour,
                "people": random.randint(10, 150),
                "vehicles": random.randint(5, 100)
            } for hour in hours
        ],
        "events_per_camera": [
            {"camera": f"CAM-{i:03d}", "events": random.randint(20, 300)}
            for i in range(1, 10)
        ]
    }

@router.get("/security")
async def get_security_analytics(current_user=Depends(get_current_user)):
    return {
        "event_types": [
            {"type": "Intrusions", "count": random.randint(5, 50)},
            {"type": "Loitering", "count": random.randint(10, 80)},
            {"type": "Zone Crossings", "count": random.randint(20, 150)},
            {"type": "Night Events", "count": random.randint(15, 60)}
        ],
        "severity": {
            "high": random.randint(5, 20),
            "medium": random.randint(20, 80),
            "low": random.randint(50, 200)
        }
    }

@router.get("/anpr")
async def get_anpr_analytics(current_user=Depends(get_current_user)):
    hours = [f"{i:02d}:00" for i in range(24)]
    return {
        "reads_timeline": [
            {"time": hour, "reads": random.randint(20, 200)}
            for hour in hours
        ],
        "confidence_distribution": [
            {"range": "95-100%", "count": 850},
            {"range": "90-95%", "count": 250},
            {"range": "80-90%", "count": 50},
            {"range": "<80%", "count": 10}
        ],
        "vehicles_by_type": [
            {"type": "Car", "count": 1500},
            {"type": "Truck", "count": 450},
            {"type": "Motorcycle", "count": 230},
            {"type": "Bus", "count": 80}
        ]
    }

@router.get("/cameras")
async def get_camera_analytics(current_user=Depends(get_current_user)):
    return {
        "overview": {
            "total": 45,
            "online": 42,
            "offline": 1,
            "degraded": 2
        },
        "performance": [
            {
                "camera_id": f"CAM-{i:03d}",
                "uptime_percent": round(random.uniform(95.0, 100.0), 2),
                "avg_fps": random.randint(20, 30),
                "health": random.choice(["excellent", "good", "warning"])
            }
            for i in range(1, 20)
        ]
    }

@router.get("/ai")
async def get_ai_analytics(current_user=Depends(get_current_user)):
    return {
        "metrics": {
            "precision": 0.94,
            "recall": 0.96,
            "detection_fps_avg": 28.5,
            "latency_ms_avg": 35.2
        },
        "model_usage": [
            {"model": "YOLOv8-Custom", "invocations": 1450000},
            {"model": "FaceNet", "invocations": 250000},
            {"model": "LPRNet", "invocations": 180000}
        ]
    }

@router.get("/overview")
async def get_analytics_overview(current_user=Depends(get_current_user)):
    return {
        "total_detections": 185000,
        "total_alerts": 423,
        "active_incidents": 5,
        "edge_nodes": 8,
        "system_health": "good",
        "recent_trend": "increasing"
    }
