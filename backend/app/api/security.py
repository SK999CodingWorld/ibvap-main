from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/security", tags=["security"])

@router.get("/overview")
async def get_security_overview():
    return {
        "authEvents24h": 142,
        "failedLogins24h": 5,
        "activeSessions": 12,
        "encryptionStatus": "healthy"
    }

@router.get("/auth-events")
async def get_auth_events():
    return [
        {"id": 1, "user": "admin", "type": "LOGIN", "timestamp": datetime.utcnow().isoformat(), "ip": "192.168.1.100", "result": "SUCCESS"},
        {"id": 2, "user": "operator01", "type": "LOGIN", "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "ip": "192.168.1.102", "result": "SUCCESS"}
    ]

@router.get("/failed-logins")
async def get_failed_logins():
    return [
        {"id": 1, "user": "unknown", "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(), "ip": "10.0.0.5", "reason": "Invalid credentials"}
    ]

@router.get("/active-sessions")
async def get_active_sessions():
    return [
        {"id": "sess-1", "user": "admin", "role": "Administrator", "login_time": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "ip": "192.168.1.100", "last_activity": datetime.utcnow().isoformat()},
        {"id": "sess-2", "user": "operator01", "role": "Operator", "login_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "ip": "192.168.1.102", "last_activity": (datetime.utcnow() - timedelta(minutes=5)).isoformat()}
    ]

@router.get("/api-activity")
async def get_api_activity():
    return [
        {"endpoint": "/api/cameras/CAM-01", "method": "GET", "count": 145},
        {"endpoint": "/api/evidence", "method": "POST", "count": 12}
    ]

@router.get("/encryption-status")
async def get_encryption_status():
    return {
        "cameraStreams": {"status": "encrypted", "protocol": "TLS 1.3", "verified": True},
        "apiTransport": {"status": "encrypted", "protocol": "HTTPS", "verified": True},
        "database": {"status": "encrypted", "protocol": "AES-256", "verified": True},
        "evidenceStorage": {"status": "encrypted", "protocol": "SHA-256 signed", "verified": True},
        "tokenSigning": {"status": "encrypted", "protocol": "RS256", "verified": True}
    }
