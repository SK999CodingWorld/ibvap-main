from fastapi import APIRouter
from typing import Optional, Dict

router = APIRouter()

@router.get("/api/detections")
async def list_detections(camera_id: Optional[str] = None, object_type: Optional[str] = None, min_confidence: Optional[float] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    return {"status": "success", "data": []}

@router.get("/api/detections/stats")
async def detection_stats():
    return {"status": "success", "stats": {}}

@router.get("/api/detections/{id}")
async def get_detection(id: str):
    return {"status": "success", "data": {"id": id}}
