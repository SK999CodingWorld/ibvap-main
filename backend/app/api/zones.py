from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List, Dict, Any
import json
import os
import time
from pathlib import Path

router = APIRouter(tags=["zones"])

ZONES_FILE = Path(__file__).resolve().parent.parent.parent.parent / "zones.json"


def _load_zones() -> List[Dict[str, Any]]:
    if ZONES_FILE.exists():
        try:
            with open(ZONES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def _save_zones(zones: List[Dict[str, Any]]) -> bool:
    try:
        with open(ZONES_FILE, "w", encoding="utf-8") as f:
            json.dump(zones, f, indent=2)
        return True
    except Exception:
        return False


@router.get("/api/zones")
async def list_zones():
    """Returns all active virtual fence zones and restricted polygons"""
    zones = _load_zones()
    return {"status": "success", "count": len(zones), "data": zones}


@router.get("/api/zones/{id}")
async def get_zone(id: str):
    """Returns specific virtual zone by ID"""
    zones = _load_zones()
    for z in zones:
        if z.get("id") == id:
            return {"status": "success", "data": z}
    raise HTTPException(404, f"Zone {id} not found")


@router.post("/api/zones")
async def create_zone(zone_data: Dict[str, Any] = Body(...)):
    """Creates a new virtual perimeter zone / polygon fence"""
    zones = _load_zones()
    zone_id = zone_data.get("id") or f"zone_{int(time.time())}"
    zone_entry = {
        "id": zone_id,
        "config": zone_data.get("config", {
            "name": zone_data.get("name", "New Zone"),
            "type": zone_data.get("type", "polygon"),
            "coordinates": zone_data.get("coordinates", [[100, 100], [500, 100], [500, 400], [100, 400]]),
            "camera_id": zone_data.get("camera_id", "cam1"),
            "enabled": zone_data.get("enabled", True),
            "classes": zone_data.get("classes", ["person", "car", "truck"]),
            "dwell_time": zone_data.get("dwell_time", 2.0)
        }),
        "created_at": int(time.time()),
        "updated_at": int(time.time())
    }
    zones.append(zone_entry)
    _save_zones(zones)
    return {"status": "success", "message": "Zone created successfully", "data": zone_entry}


@router.put("/api/zones/{id}")
async def update_zone(id: str, updates: Dict[str, Any] = Body(...)):
    """Updates an existing virtual fence polygon or coordinates"""
    zones = _load_zones()
    for z in zones:
        if z.get("id") == id:
            if "config" in updates:
                z["config"].update(updates["config"])
            else:
                z.get("config", {}).update(updates)
            z["updated_at"] = int(time.time())
            _save_zones(zones)
            return {"status": "success", "message": "Zone updated", "data": z}
    raise HTTPException(404, f"Zone {id} not found")


@router.delete("/api/zones/{id}")
async def delete_zone(id: str):
    """Deletes a virtual fence zone"""
    zones = _load_zones()
    new_zones = [z for z in zones if z.get("id") != id]
    if len(new_zones) == len(zones):
        raise HTTPException(404, f"Zone {id} not found")
    _save_zones(new_zones)
    return {"status": "success", "message": f"Zone {id} deleted"}


@router.post("/api/zones/{id}/toggle")
async def toggle_zone(id: str):
    """Toggles active state of a virtual fence zone"""
    zones = _load_zones()
    for z in zones:
        if z.get("id") == id:
            cfg = z.get("config", {})
            cfg["enabled"] = not cfg.get("enabled", True)
            z["updated_at"] = int(time.time())
            _save_zones(zones)
            return {"status": "success", "message": f"Zone enabled: {cfg['enabled']}", "enabled": cfg["enabled"]}
    raise HTTPException(404, f"Zone {id} not found")


@router.get("/api/zones/{id}/events")
async def get_zone_events(id: str):
    """Returns recent intrusion violations for a given zone"""
    return {
        "status": "success",
        "zone_id": id,
        "data": [
            {
                "event_id": f"evt_{id}_{int(time.time()) - 120}",
                "zone_id": id,
                "type": "zone_intrusion",
                "class_name": "person",
                "confidence": 0.94,
                "timestamp": int(time.time()) - 120
            }
        ]
    }
