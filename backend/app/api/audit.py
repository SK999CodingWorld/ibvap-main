from fastapi import APIRouter
from typing import Optional
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
async def list_audit_logs(user: Optional[str] = None, action: Optional[str] = None, resource_type: Optional[str] = None):
    return audit_service.get_logs(user, action, resource_type)

@router.get("/stats")
async def get_audit_stats():
    logs = audit_service.audit_logs
    total = len(logs)
    logins = len([l for l in logs if l["action"] == "LOGIN"])
    configs = len([l for l in logs if l["action"] == "CONFIG_CHANGE"])
    evidence = len([l for l in logs if l["action"] == "EVIDENCE_ACCESS"])
    
    return {
        "total": total,
        "logins": logins,
        "configs": configs,
        "evidence": evidence
    }
