from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List
from app.ai.reid_engine import reid_engine

router = APIRouter(tags=["tracking"])

@router.get("/api/tracks")
async def list_tracks():
    """Returns active global Re-ID tracks and identities"""
    identities = reid_engine.get_all_identities()
    return {"status": "success", "count": len(identities), "data": identities}

@router.get("/api/tracks/cross-camera")
async def get_cross_camera_tracks():
    """Returns all cross-camera transition events and global trajectories"""
    transitions = reid_engine.get_transitions(limit=100)
    return {"status": "success", "count": len(transitions), "data": transitions}

@router.get("/api/tracks/{tracking_id}")
async def get_track(tracking_id: str):
    """Returns camera history and details for a specific global ID"""
    transitions = reid_engine.get_transitions(global_id=tracking_id, limit=50)
    return {
        "status": "success", 
        "global_id": tracking_id, 
        "history": transitions
    }

@router.get("/api/tracks/{tracking_id}/path")
async def get_track_path(tracking_id: str):
    """Returns the multi-camera journey path for a subject"""
    transitions = reid_engine.get_transitions(global_id=tracking_id, limit=50)
    cams = [t["camera_id"] for t in transitions]
    return {"status": "success", "global_id": tracking_id, "cameras_visited": list(dict.fromkeys(cams))}
