from fastapi import APIRouter
from typing import List, Dict

router = APIRouter(prefix="/api/map", tags=["map"])

@router.get("/cameras")
async def get_map_cameras():
    return [
        { "id": "BOP-01", "name": "Border Outpost Alpha", "lat": 27.05, "lon": 88.45, "status": "online", "alertLevel": "critical" },
        { "id": "BOP-02", "name": "Border Outpost Bravo", "lat": 27.03, "lon": 88.48, "status": "online", "alertLevel": "low" },
        { "id": "BOP-03", "name": "Border Outpost Charlie", "lat": 27.07, "lon": 88.52, "status": "online", "alertLevel": "low" },
        { "id": "CHECK-01", "name": "Checkpoint Charlie", "lat": 27.02, "lon": 88.50, "status": "online", "alertLevel": "medium" },
        { "id": "ROAD-01", "name": "Access Road North", "lat": 27.06, "lon": 88.47, "status": "online", "alertLevel": "high" },
        { "id": "ROAD-02", "name": "Access Road South", "lat": 27.01, "lon": 88.49, "status": "offline", "alertLevel": "low" },
        { "id": "GATE-01", "name": "Main Gate Entry", "lat": 27.04, "lon": 88.51, "status": "online", "alertLevel": "low" },
        { "id": "WATCH-01", "name": "Watchtower Delta", "lat": 27.08, "lon": 88.46, "status": "online", "alertLevel": "low" },
    ]

@router.get("/incidents")
async def get_map_incidents():
    return [
        { "id": "INC-001", "lat": 27.055, "lon": 88.455, "type": "Unauthorized Crossing", "severity": "critical" }
    ]

@router.get("/zones")
async def get_map_zones():
    return [
        { "id": "Z-01", "name": "No Go Zone A", "coordinates": [[27.04, 88.44], [27.06, 88.44], [27.06, 88.46], [27.04, 88.46]] }
    ]

@router.get("/tracks")
async def get_map_tracks():
    return [
        { "id": "TRK-001", "path": [[27.03, 88.48], [27.04, 88.50], [27.04, 88.51]] }
    ]

@router.get("/alerts")
async def get_map_alerts():
    return [
        { "id": "ALT-001", "lat": 27.06, "lon": 88.47, "type": "Vehicle Detection", "severity": "high" }
    ]
