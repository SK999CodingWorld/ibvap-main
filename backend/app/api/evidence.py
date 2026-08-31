import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
from app.ai.evidence_vault import evidence_vault

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

@router.get("")
@router.get("/")
@router.get("/search")
async def search_evidence(
    q: Optional[str] = None,
    object_type: Optional[str] = None,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """
    Search and filter forensic evidence cases by object type, alert type,
    severity level, camera, or text keywords.
    """
    cases = evidence_vault.search_cases(
        query=q,
        object_type=object_type,
        alert_type=alert_type,
        severity=severity,
        camera_id=camera_id,
        limit=limit
    )
    return {"status": "success", "count": len(cases), "data": cases}

@router.get("/stats")
async def get_evidence_stats():
    """Returns total cases, severity distribution, and vault status"""
    stats = evidence_vault.get_stats()
    return {"status": "success", "stats": stats}

@router.get("/snapshot/{filename}")
async def get_evidence_snapshot(filename: str):
    """Serves the high-resolution cropped forensic snapshot image"""
    filepath = os.path.join(evidence_vault.storage_dir, filename)
    if not os.path.exists(filepath):
        # Fallback to demo snapshot if exact file not found
        for f in os.listdir(evidence_vault.storage_dir):
            if f.endswith(('.jpg', '.png')):
                return FileResponse(os.path.join(evidence_vault.storage_dir, f), media_type="image/jpeg")
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return FileResponse(filepath, media_type="image/jpeg")

@router.get("/{case_id}")
async def get_case_details(case_id: str):
    """Returns details for a single forensic evidence case"""
    cases = evidence_vault.search_cases(query=case_id, limit=1)
    if not cases:
        raise HTTPException(status_code=404, detail="Evidence case not found")
    return {"status": "success", "data": cases[0]}
