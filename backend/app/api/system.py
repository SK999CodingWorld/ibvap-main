from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.api.auth import get_current_user
import random

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/health")
async def get_system_health(current_user=Depends(get_current_user)):
    return {
        "status": "healthy",
        "uptime": "14d 5h 22m",
        "version": "1.0.0-rc.3"
    }

@router.get("/metrics")
async def get_system_metrics(current_user=Depends(get_current_user)):
    return {
        "cpu": {
            "usage": 42.5,
            "cores": 16,
            "temp": 65
        },
        "gpu": {
            "usage": 67.2,
            "memory_used": "14.5 GB",
            "memory_total": "24 GB",
            "temp": 72
        },
        "ram": {
            "usage": 58.0,
            "used": "37 GB",
            "total": "64 GB"
        },
        "disk": {
            "usage": 34.1,
            "used": "1.2 TB",
            "total": "4 TB"
        },
        "network": {
            "bandwidth_mbps": 38.5,
            "rx_mbps": 22.1,
            "tx_mbps": 16.4
        }
    }

@router.get("/ai-models")
async def get_ai_models_status(current_user=Depends(get_current_user)):
    return {
        "models": [
            {
                "id": "det-v1",
                "name": "ObjectDetector",
                "version": "1.0",
                "status": "active",
                "fps": 28.5,
                "latency_ms": 35.2,
                "device": "gpu:0"
            },
            {
                "id": "face-v2",
                "name": "FaceRecognizer",
                "version": "2.1",
                "status": "active",
                "fps": 15.0,
                "latency_ms": 85.0,
                "device": "gpu:1"
            },
            {
                "id": "anpr-v1",
                "name": "LPRNet",
                "version": "1.2",
                "status": "active",
                "fps": 45.0,
                "latency_ms": 22.0,
                "device": "gpu:0"
            }
        ]
    }

@router.get("/services")
async def get_services_status(current_user=Depends(get_current_user)):
    return {
        "services": [
            {"name": "API Gateway", "status": "online", "uptime": "14d 5h 22m"},
            {"name": "Database", "status": "online", "uptime": "30d 12h 10m"},
            {"name": "Redis Cache", "status": "online", "uptime": "30d 12h 10m"},
            {"name": "AI Inference Engine", "status": "online", "uptime": "14d 5h 20m"},
            {"name": "Camera Gateway", "status": "online", "uptime": "14d 5h 21m"},
            {"name": "Edge Sync Service", "status": "online", "uptime": "14d 5h 15m"}
        ]
    }
