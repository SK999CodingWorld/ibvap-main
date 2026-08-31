from datetime import datetime
from typing import List, Dict, Optional
import uuid

class AuditService:
    def __init__(self):
        self.audit_logs = []
        self._seed_logs()

    def _seed_logs(self):
        actions = ["LOGIN", "LOGOUT", "CAMERA_CHANGE", "ZONE_CHANGE", "AI_CONFIG_CHANGE", "EVIDENCE_ACCESS", "INCIDENT_CHANGE", "USER_CHANGE", "CONFIG_CHANGE", "EXPORT", "ALERT_ACTION"]
        users = ["admin", "commander01", "operator01", "analyst01", "auditor01"]
        
        for i in range(25):
            self.log_action(
                user_id=f"usr-{i%5}",
                username=users[i%5],
                action=actions[i % len(actions)],
                resource_type="System" if i%2==0 else "Camera",
                resource_id=f"res-{i}",
                details=f"Mock audit action {i}",
                ip_address=f"192.168.1.{i+10}",
                result="Success" if i % 10 != 0 else "Failure"
            )

    def log_action(self, user_id: str, username: str, action: str, resource_type: str, resource_id: str, details: str, ip_address: str, result: str):
        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "username": username,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details,
            "ip_address": ip_address,
            "result": result
        }
        self.audit_logs.insert(0, log_entry)
        return log_entry

    def get_logs(self, user: str = None, action: str = None, resource_type: str = None) -> List[Dict]:
        logs = self.audit_logs
        if user: logs = [l for l in logs if l["username"] == user]
        if action: logs = [l for l in logs if l["action"] == action]
        if resource_type: logs = [l for l in logs if l["resource_type"] == resource_type]
        return logs

audit_service = AuditService()
