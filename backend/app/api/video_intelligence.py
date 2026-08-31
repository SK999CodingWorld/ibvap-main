from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.ai.video_intelligence import intelligence_engine
from app.core.security import get_current_active_user

router = APIRouter(prefix="/api/video-intelligence", tags=["video-intelligence"])

class AnalyzeVideoResponse(BaseModel):
    video_id: str
    filename: str
    duration_seconds: float
    duration_formatted: str
    total_frames_analyzed: int
    fps: float
    counts: Dict[str, int]
    event_timeline: List[Dict[str, Any]]
    detected_objects: List[Dict[str, Any]]
    anpr_reads: List[Dict[str, Any]]
    risk_summary: Dict[str, Any]

@router.get("/capabilities")
async def get_capabilities():
    """Returns the full AI Model capability taxonomy, enabled classes, and models."""
    return intelligence_engine.get_supported_model_capabilities()

@router.get("/camera/{camera_id}/telemetry")
async def get_camera_telemetry(camera_id: str):
    """Returns active detections, attributes, motion vectors, and trajectories for a camera."""
    detections = intelligence_engine.generate_demo_detections_for_camera(camera_id)
    return {
        "camera_id": camera_id,
        "detection_count": len(detections),
        "detections": detections
    }

@router.get("/camera/{camera_id}/quality")
async def get_camera_quality(camera_id: str, is_night: bool = False):
    """Assesses stream quality, blur, lighting, fog/haze, and camera tampering state."""
    quality = intelligence_engine.assess_camera_image_quality(camera_id, is_night)
    return quality

@router.get("/camera/{camera_id}/crowd")
async def get_crowd_metrics(camera_id: str, people_count: int = 4):
    """Returns crowd density, growth rate, and dominant movement direction."""
    return intelligence_engine.calculate_crowd_metrics(camera_id, people_count)

@router.get("/heatmap-data")
async def get_surveillance_heatmap():
    """Returns border sector coordinates, human activity density, vehicle corridors, and intrusion hotspots."""
    return {
        "sectors": [
            {"sector": "Sector 4 (Red Zone Alpha)", "human_density": 88, "vehicle_density": 22, "alert_count": 14, "lat": 26.9124, "lng": 70.9012, "risk_level": "CRITICAL"},
            {"sector": "Sector 4 (Buffer Zone West)", "human_density": 42, "vehicle_density": 10, "alert_count": 5, "lat": 26.9180, "lng": 70.8950, "risk_level": "HIGH"},
            {"sector": "Highway 1 Checkpoint Alpha", "human_density": 35, "vehicle_density": 94, "alert_count": 8, "lat": 26.9250, "lng": 70.9120, "risk_level": "MEDIUM"},
            {"sector": "Sector 2 Approach North", "human_density": 20, "vehicle_density": 78, "alert_count": 3, "lat": 26.9310, "lng": 70.9200, "risk_level": "LOW"},
            {"sector": "HQ Base Camp Gate", "human_density": 65, "vehicle_density": 50, "alert_count": 1, "lat": 26.9050, "lng": 70.9300, "risk_level": "LOW"}
        ],
        "hourly_trends": [
            {"hour": "00:00", "people": 4, "vehicles": 8, "alerts": 2},
            {"hour": "04:00", "people": 7, "vehicles": 12, "alerts": 3},
            {"hour": "08:00", "people": 38, "vehicles": 65, "alerts": 4},
            {"hour": "12:00", "people": 45, "vehicles": 82, "alerts": 2},
            {"hour": "16:00", "people": 52, "vehicles": 74, "alerts": 5},
            {"hour": "20:00", "people": 28, "vehicles": 40, "alerts": 6}
        ]
    }

@router.post("/analyze-video", response_model=AnalyzeVideoResponse)
async def analyze_uploaded_video(filename: str = Query("surveillance_clip.mp4"), duration_seconds: float = Query(161.0)):
    """Simulates/Executes comprehensive frame-by-frame analysis of an uploaded video stream."""
    return AnalyzeVideoResponse(
        video_id=f"VID-{int(time.time())}",
        filename=filename,
        duration_seconds=duration_seconds,
        duration_formatted="02m 41s",
        total_frames_analyzed=int(duration_seconds * 30),
        fps=30.0,
        counts={
            "people": 27,
            "vehicles": 12,
            "animals": 4,
            "zone_events": 6,
            "loitering": 2,
            "anpr_reads": 8,
            "critical_threats": 1,
            "high_threats": 3,
            "medium_threats": 4,
            "low_threats": 19
        },
        event_timeline=[
            {"timestamp": "00:00:14", "time_seconds": 14, "event": "PERSON_DETECTED", "target": "P-101", "risk": "LOW", "detail": "Person standing near Outer Gate"},
            {"timestamp": "00:00:38", "time_seconds": 38, "event": "VEHICLE_DETECTED", "target": "V-014 (SUV)", "risk": "MEDIUM", "detail": "Vehicle approached Checkpoint Lane 1"},
            {"timestamp": "00:00:42", "time_seconds": 42, "event": "ANPR_READ", "target": "MH 12 AB 1234", "risk": "LOW", "detail": "Plate recognized with 98.2% confidence"},
            {"timestamp": "00:01:15", "time_seconds": 75, "event": "ZONE_ENTRY", "target": "P-104", "risk": "HIGH", "detail": "Crossed into Restricted Perimeter Alpha"},
            {"timestamp": "00:01:48", "time_seconds": 108, "event": "LOITERING", "target": "P-104", "risk": "CRITICAL", "detail": "Dwell time exceeded 120s near boundary fence"},
            {"timestamp": "00:02:10", "time_seconds": 130, "event": "ANIMAL_DETECTED", "target": "A-002", "risk": "LOW", "detail": "Wild animal filtered - No intrusion alarm triggered"},
            {"timestamp": "00:02:35", "time_seconds": 155, "event": "DIRECTION_VIOLATION", "target": "P-104", "risk": "CRITICAL", "detail": "Vector directed toward sensitive outpost asset"}
        ],
        detected_objects=[
            {"id": "P-104", "type": "PERSON", "confidence": 96.4, "action": "walking", "clothing": "Navy Jacket / Dark Pants", "dwell": "02m 15s", "max_risk": 87},
            {"id": "V-014", "type": "VEHICLE (SUV)", "confidence": 98.2, "plate": "MH 12 AB 1234", "speed": "32 km/h", "dwell": "00m 45s", "max_risk": 38},
            {"id": "A-002", "type": "ANIMAL (Wild)", "confidence": 92.1, "species": "Wild Animal", "filter": "Filtered to Low Risk", "dwell": "00m 30s", "max_risk": 12}
        ],
        anpr_reads=[
            {"plate": "MH 12 AB 1234", "type": "SUV", "confidence": 98.2, "status": "CONFIRMED", "timestamp": "00:00:42"},
            {"plate": "DL 01 XY 8899", "type": "Truck", "confidence": 94.5, "status": "CONFIRMED", "timestamp": "00:01:30"}
        ],
        risk_summary={
            "overall_score": 87,
            "rating": "CRITICAL",
            "primary_reason": "Person P-104 entered Restricted Zone Alpha during non-operational hours and loitered for 135s",
            "chain_of_custody_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        }
    )
