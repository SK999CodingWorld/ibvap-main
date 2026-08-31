from fastapi import APIRouter

router = APIRouter()

@router.get("/api/faces/detections")
async def list_face_detections():
    return {"status": "success", "data": []}

@router.get("/api/faces/config")
async def get_face_config():
    return {"status": "success", "data": {"detection_enabled": True, "identification_enabled": False}}

@router.put("/api/faces/config")
async def update_face_config():
    return {"status": "success", "message": "updated"}
