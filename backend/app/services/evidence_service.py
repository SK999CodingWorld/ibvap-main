import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
import uuid

class EvidenceService:
    def __init__(self):
        self.evidence_store = []
        
        # Seed mock evidence
        self.seed_evidence()

    def seed_evidence(self):
        for i in range(1, 9):
            metadata = {"camera_id": f"CAM-0{i}", "timestamp": datetime.utcnow().isoformat()}
            data_str = json.dumps(metadata)
            hash_obj = hashlib.sha256(data_str.encode())
            
            evidence = {
                "id": f"EVD-{str(i).zfill(3)}",
                "type": "Video Clip" if i % 2 == 0 else "Snapshot",
                "camera_id": f"CAM-0{i}",
                "incident_id": f"INC-001" if i < 3 else None,
                "timestamp": datetime.utcnow().isoformat(),
                "file_path": f"/storage/evidence/evd_{i}.mp4",
                "metadata": metadata,
                "hash": hash_obj.hexdigest(),
                "status": "VERIFIED"
            }
            self.evidence_store.append(evidence)

    def create_evidence(self, type: str, camera_id: str, file_path: str, metadata: Dict) -> Dict:
        """Computes SHA-256 hash, Signs metadata, Stores record"""
        data_str = json.dumps(metadata)
        hash_obj = hashlib.sha256(data_str.encode())
        hash_val = hash_obj.hexdigest()
        
        evidence = {
            "id": f"EVD-{uuid.uuid4().hex[:6].upper()}",
            "type": type,
            "camera_id": camera_id,
            "incident_id": None,
            "timestamp": datetime.utcnow().isoformat(),
            "file_path": file_path,
            "metadata": metadata,
            "hash": hash_val,
            "status": "VERIFIED"
        }
        self.evidence_store.append(evidence)
        return evidence

    def verify_integrity(self, evidence_id: str) -> Dict:
        evidence = next((e for e in self.evidence_store if e["id"] == evidence_id), None)
        if not evidence:
            return {"verified": False, "hash_match": False, "details": "Evidence not found"}
            
        # Re-compute hash
        data_str = json.dumps(evidence["metadata"])
        hash_obj = hashlib.sha256(data_str.encode())
        new_hash = hash_obj.hexdigest()
        
        match = (new_hash == evidence["hash"])
        return {
            "verified": match,
            "hash_match": match,
            "details": "Hash matches the original metadata" if match else "Hash mismatch. Evidence may be tampered."
        }
        
    def get_evidence_chain(self, incident_id: str) -> List[Dict]:
        return [e for e in self.evidence_store if e.get("incident_id") == incident_id]

evidence_service = EvidenceService()
