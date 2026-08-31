from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
from app.api.auth import get_current_user
import uuid
import random

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
async def global_search(q: str = Query(..., min_length=1), current_user=Depends(get_current_user)):
    q = q.lower()
    results = {
        "cameras": [],
        "events": [],
        "incidents": [],
        "plates": [],
        "users": []
    }
    
    # Mock some search results based on query
    if "cam" in q or q.isdigit():
        results["cameras"].append({
            "id": f"CAM-{random.randint(1, 99):03d}",
            "name": f"Border Camera {random.randint(1, 99)}",
            "type": "camera"
        })
    
    if "per" in q or "veh" in q or "int" in q:
        results["events"].append({
            "id": str(uuid.uuid4())[:8],
            "title": f"Detection matching '{q}'",
            "timestamp": "2026-08-25T10:30:00Z",
            "type": "event"
        })
        
    if "mh" in q or "dl" in q or any(c.isdigit() for c in q):
        results["plates"].append({
            "plate_number": q.upper() if len(q) > 4 else f"{q.upper()}1234",
            "detected_at": "2026-08-25T09:15:00Z",
            "camera": "CAM-015",
            "type": "plate"
        })
        
    if "inc" in q or "sec" in q:
        results["incidents"].append({
            "id": f"INC-2026-{random.randint(1000, 9999)}",
            "title": "Security Breach",
            "status": "open",
            "type": "incident"
        })
        
    if "admin" in q or "usr" in q:
        results["users"].append({
            "id": str(uuid.uuid4())[:8],
            "name": "System Administrator",
            "email": "admin@ibvap.gov.in",
            "type": "user"
        })
        
    # Aggregate counts
    total = sum(len(items) for items in results.values())
    
    return {
        "query": q,
        "total_results": total,
        "results": results
    }
