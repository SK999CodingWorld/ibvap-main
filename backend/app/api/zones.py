from fastapi import APIRouter

router = APIRouter()

@router.get("/api/zones")
async def list_zones():
    return {"status": "success", "data": []}

@router.get("/api/zones/{id}")
async def get_zone(id: str):
    return {"status": "success", "data": {"id": id}}

@router.post("/api/zones")
async def create_zone():
    return {"status": "success", "message": "created"}

@router.put("/api/zones/{id}")
async def update_zone(id: str):
    return {"status": "success", "message": "updated"}

@router.delete("/api/zones/{id}")
async def delete_zone(id: str):
    return {"status": "success", "message": "deleted"}

@router.get("/api/zones/{id}/events")
async def get_zone_events(id: str):
    return {"status": "success", "data": []}

@router.post("/api/zones/{id}/toggle")
async def toggle_zone(id: str):
    return {"status": "success", "message": "toggled"}
