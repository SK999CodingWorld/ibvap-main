from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.camera_service import get_camera_health, calculate_health_score, detect_camera_issues

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

class CameraBase(BaseModel):
    name: str
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    rtsp_url: str
    resolution: str = "1080p"
    fps: int = 30
    camera_type: str = "PTZ"
    zone: str
    night_vision: bool = True
    onvif: bool = True

class CameraCreate(CameraBase):
    id: str

class CameraResponse(CameraCreate):
    status: str = "online"
    health_score: int = 100

# Mock DB for cameras
MOCK_CAMERAS = {
    "BOP-01": {"id": "BOP-01", "name": "BOP Main Gate", "location": "Sector 4", "rtsp_url": "rtsp://...", "zone": "Red Zone", "status": "online"},
    "BOP-02": {"id": "BOP-02", "name": "BOP Perimeter East", "location": "Sector 4", "rtsp_url": "rtsp://...", "zone": "Red Zone", "status": "online"},
    "BOP-03": {"id": "BOP-03", "name": "BOP Perimeter West", "location": "Sector 4", "rtsp_url": "rtsp://...", "zone": "Red Zone", "status": "online"},
    "CHECK-01": {"id": "CHECK-01", "name": "Highway Checkpoint Alpha", "location": "Highway 1", "rtsp_url": "rtsp://...", "zone": "Yellow Zone", "status": "online"},
    "ROAD-01": {"id": "ROAD-01", "name": "Approach Road North", "location": "Sector 2", "rtsp_url": "rtsp://...", "zone": "Yellow Zone", "status": "online"},
    "ROAD-02": {"id": "ROAD-02", "name": "Approach Road South", "location": "Sector 2", "rtsp_url": "rtsp://...", "zone": "Yellow Zone", "status": "online"},
    "GATE-01": {"id": "GATE-01", "name": "Base Camp Entry", "location": "HQ", "rtsp_url": "rtsp://...", "zone": "Green Zone", "status": "online"},
    "WATCH-01": {"id": "WATCH-01", "name": "Watchtower 7", "location": "Sector 5", "rtsp_url": "rtsp://...", "zone": "Red Zone", "status": "offline"}
}

@router.get("")
async def list_cameras(status: Optional[str] = None, zone: Optional[str] = None, current_user = Depends(get_current_user)):
    cams = list(MOCK_CAMERAS.values())
    if status:
        cams = [c for c in cams if c["status"] == status]
    if zone:
        cams = [c for c in cams if c["zone"] == zone]
    
    # Enrich with mock health
    for c in cams:
        health = get_camera_health(c["id"])
        c["health_score"] = health["score"]
        c["status"] = "online" if health["stream_active"] else "offline"
        
    return cams

@router.get("/health/summary")
async def get_health_summary(current_user = Depends(get_current_user)):
    total = len(MOCK_CAMERAS)
    healthy = 0
    degraded = 0
    critical = 0
    total_score = 0
    
    for cam_id in MOCK_CAMERAS:
        health = get_camera_health(cam_id)
        score = health["score"]
        total_score += score
        
        if score > 80:
            healthy += 1
        elif score > 50:
            degraded += 1
        else:
            critical += 1
            
    return {
        "average_health": total_score // total if total else 0,
        "total": total,
        "healthy": healthy,
        "degraded": degraded,
        "critical": critical
    }

@router.get("/{camera_id}")
async def get_camera(camera_id: str, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam = dict(MOCK_CAMERAS[camera_id])
    health = get_camera_health(camera_id)
    cam["health_score"] = health["score"]
    cam["status"] = "online" if health["stream_active"] else "offline"
    return cam

@router.post("")
async def create_camera(camera: CameraCreate, current_user = Depends(get_current_user)):
    MOCK_CAMERAS[camera.id] = camera.model_dump()
    MOCK_CAMERAS[camera.id]["status"] = "online"
    return MOCK_CAMERAS[camera.id]

@router.put("/{camera_id}")
async def update_camera(camera_id: str, camera: CameraBase, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    update_data = camera.model_dump()
    update_data["id"] = camera_id
    update_data["status"] = MOCK_CAMERAS[camera_id].get("status", "online")
    MOCK_CAMERAS[camera_id] = update_data
    return MOCK_CAMERAS[camera_id]

@router.delete("/{camera_id}")
async def delete_camera(camera_id: str, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    del MOCK_CAMERAS[camera_id]
    return {"message": "Camera deleted successfully"}

@router.post("/{camera_id}/test")
async def test_camera(camera_id: str, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"status": "success", "message": "Connection test successful"}

@router.post("/{camera_id}/restart")
async def restart_camera(camera_id: str, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"status": "success", "message": "Camera stream restarted"}

@router.get("/{camera_id}/health")
async def camera_health(camera_id: str, current_user = Depends(get_current_user)):
    if camera_id not in MOCK_CAMERAS:
        raise HTTPException(status_code=404, detail="Camera not found")
    return get_camera_health(camera_id)
