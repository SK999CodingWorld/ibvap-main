import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def admin_token(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    data = response.json()
    return data.get("access_token")

@pytest.fixture
async def auth_headers(admin_token: str):
    return {"Authorization": f"Bearer {admin_token}"}
