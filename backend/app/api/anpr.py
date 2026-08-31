from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from app.ai.anpr_engine import anpr_engine

router = APIRouter(tags=["anpr"])

@router.get("/api/anpr/reads")
async def list_anpr_reads(
    plate: Optional[str] = None, 
    camera: Optional[str] = None, 
    limit: int = Query(50, ge=1, le=500)
):
    """Returns persistent ANPR vehicle plate read history from SQLite database"""
    logs = anpr_engine.get_logs(query=plate or camera, limit=limit)
    return {"status": "success", "count": len(logs), "data": logs}

@router.get("/api/anpr/search/{plate}")
async def search_plate(plate: str):
    """Searches vehicle plate history by exact or partial plate number"""
    logs = anpr_engine.get_logs(query=plate, limit=50)
    return {"status": "success", "query": plate, "matches": len(logs), "data": logs}

@router.get("/api/anpr/stats")
async def anpr_stats():
    """Returns total ANPR vehicle reads, unique plates, and vehicle distribution"""
    stats = anpr_engine.get_stats()
    return {"status": "success", "stats": stats}
