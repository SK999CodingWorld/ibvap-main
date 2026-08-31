import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_get_cameras(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/cameras", headers=auth_headers)
    assert response.status_code == 200
    cameras = response.json()
    assert isinstance(cameras, list)
    assert len(cameras) >= 1

@pytest.mark.asyncio
async def test_get_dashboard_kpis(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/dashboard/kpis", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "cameras_online" in data
    assert "people_detected" in data
    assert "system_health_score" in data

@pytest.mark.asyncio
async def test_simulation_status(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/simulation/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "running" in data
    assert "speed" in data

@pytest.mark.asyncio
async def test_evidence_verification(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/evidence/", headers=auth_headers)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_edge_status(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/edge/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "bandwidth_savings" in data
