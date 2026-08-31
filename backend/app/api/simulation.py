from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.core.security import get_current_user
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

class SpeedRequest(BaseModel):
    speed: float

@router.get("/status")
async def get_status(current_user = Depends(get_current_user)):
    return simulation_engine.get_status()

@router.post("/start")
async def start_simulation(current_user = Depends(get_current_user)):
    simulation_engine.start()
    return {"status": "started"}

@router.post("/stop")
async def stop_simulation(current_user = Depends(get_current_user)):
    simulation_engine.stop()
    return {"status": "stopped"}

@router.post("/speed")
async def set_speed(request: SpeedRequest, current_user = Depends(get_current_user)):
    if request.speed not in [0.5, 1.0, 2.0, 5.0, 10.0]:
        raise HTTPException(status_code=400, detail="Invalid speed multiplier")
    simulation_engine.set_speed(request.speed)
    return {"status": "success", "speed": request.speed}

@router.post("/trigger/{scenario}")
async def trigger_scenario(scenario: str, current_user = Depends(get_current_user)):
    valid_scenarios = [
        "intrusion", "night_intrusion", "vehicle_anpr", "loitering", 
        "multi_camera", "network_outage", "camera_failure", 
        "correlated_incident", "evidence_verify", "normal"
    ]
    if scenario not in valid_scenarios:
        raise HTTPException(status_code=400, detail="Invalid scenario")
        
    await simulation_engine.trigger_scenario(scenario)
    return {"status": "success", "scenario": scenario}

@router.get("/scenarios")
async def list_scenarios(current_user = Depends(get_current_user)):
    return {
        "scenarios": [
            {"id": "normal", "name": "Normal Surveillance"},
            {"id": "intrusion", "name": "Person enters restricted zone"},
            {"id": "night_intrusion", "name": "Night intrusion"},
            {"id": "vehicle_anpr", "name": "Vehicle detected + ANPR"},
            {"id": "loitering", "name": "Loitering"},
            {"id": "multi_camera", "name": "Multiple-camera movement"},
            {"id": "network_outage", "name": "Network outage"},
            {"id": "camera_failure", "name": "Camera failure"},
            {"id": "correlated_incident", "name": "Correlated incident"},
            {"id": "evidence_verify", "name": "Evidence integrity verification"}
        ]
    }
