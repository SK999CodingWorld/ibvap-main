from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.services.edge_simulator import edge_sim
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/edge", tags=["edge"])

@router.get("/status")
async def get_edge_status(current_user=Depends(get_current_user)):
    return edge_sim.get_status_summary()

@router.get("/nodes")
async def get_edge_nodes(current_user=Depends(get_current_user)):
    return {"nodes": [
        {
            "id": nid,
            **node_data
        }
        for nid, node_data in edge_sim.get_status_summary()["nodes"].items()
    ]}

@router.get("/nodes/{node_id}")
async def get_edge_node(node_id: str, current_user=Depends(get_current_user)):
    summary = edge_sim.get_status_summary()
    if node_id not in summary["nodes"]:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"id": node_id, **summary["nodes"][node_id]}

@router.post("/network/{status}")
async def set_network_status(status: str, current_user=Depends(get_current_user)):
    if status not in ["online", "degraded", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    edge_sim.set_network_status(status)
    return {"status": "success", "network_status": status}

@router.post("/sync/{node_id}")
async def sync_node(node_id: str, current_user=Depends(get_current_user)):
    result = await edge_sim.sync_node(node_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Node not found")
    return result

@router.post("/sync/all")
async def sync_all_nodes(current_user=Depends(get_current_user)):
    results = {}
    for node_id in edge_sim.nodes.keys():
        results[node_id] = await edge_sim.sync_node(node_id)
    return {"status": "success", "results": results}

@router.get("/bandwidth")
async def get_bandwidth_savings(current_user=Depends(get_current_user)):
    return edge_sim.get_status_summary()["bandwidth_savings"]
