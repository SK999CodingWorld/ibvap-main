from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List
from app.ai.reid_engine import reid_engine
from app.ai.realtime_stream import live_stream_processor

router = APIRouter(tags=["tracking"])

@router.get("/api/tracks")
async def list_tracks():
    """Returns active global Re-ID tracks and identities"""
    identities = reid_engine.get_all_identities()
    return {"status": "success", "count": len(identities), "data": identities}

@router.get("/api/tracks/feed")
@router.get("/api/tracking/live")
async def get_live_tracking_feed(limit: int = Query(50, ge=1, le=100)):
    """Returns real-time confirmed tracking detections and active in-frame rows"""
    feed = live_stream_processor.get_live_detection_feed(limit=limit)
    return {"status": "success", "count": len(feed), "data": feed}

@router.get("/api/tracks/stats")
@router.get("/api/tracking/stats")
async def get_live_tracking_stats():
    """Returns live KPI counts (total people, vehicles, active tracks in frame, avg confidence)"""
    stats = live_stream_processor.get_tracking_stats()
    return {"status": "success", "stats": stats}

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
