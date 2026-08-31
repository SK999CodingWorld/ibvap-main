from typing import List, Dict, Any, Optional
from datetime import datetime

class Incident:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        if not hasattr(self, 'status'):
            self.status = 'Detected'
        if not hasattr(self, 'timeline'):
            self.timeline = []
        if not hasattr(self, 'notes'):
            self.notes = []

class IncidentService:
    def __init__(self, db_session):
        self.db = db_session
        self.incident_counter = 0
        self.incidents: Dict[str, Incident] = {} # Mock DB
        
    async def create_incident(self, alert_ids: List[str], camera_ids: List[str], severity: str, location: str) -> Incident:
        incident_id = self.generate_incident_id()
        incident = Incident(
            id=incident_id,
            alert_ids=alert_ids,
            camera_ids=camera_ids,
            severity=severity,
            location=location,
            created_at=datetime.utcnow(),
            timeline=[{
                'timestamp': datetime.utcnow(),
                'action': 'Detected',
                'details': 'Incident automatically detected from alerts'
            }]
        )
        self.incidents[incident_id] = incident
        return incident

    async def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> Optional[Incident]:
        incident = self.incidents.get(incident_id)
        if not incident:
            return None
        for k, v in updates.items():
            setattr(incident, k, v)
        return incident

    async def assign_incident(self, incident_id: str, user_id: str) -> Optional[Incident]:
        incident = self.incidents.get(incident_id)
        if not incident:
            return None
        incident.assigned_to = user_id
        incident.timeline.append({
            'timestamp': datetime.utcnow(),
            'action': 'Assigned',
            'details': f'Assigned to {user_id}'
        })
        incident.status = 'Assigned'
        return incident

    async def add_note(self, incident_id: str, user_id: str, note_text: str) -> Optional[Incident]:
        incident = self.incidents.get(incident_id)
        if not incident:
            return None
        incident.notes.append({
            'timestamp': datetime.utcnow(),
            'user_id': user_id,
            'text': note_text
        })
        incident.timeline.append({
            'timestamp': datetime.utcnow(),
            'action': 'Note added',
            'details': f'Note added by {user_id}'
        })
        return incident

    async def update_status(self, incident_id: str, new_status: str, user_id: str = "system") -> Optional[Incident]:
        # enforce lifecycle: Detected -> Verified -> Assigned -> Investigating -> Resolved
        valid_transitions = {
            'Detected': ['Verified', 'Resolved'],
            'Verified': ['Assigned', 'Investigating', 'Resolved'],
            'Assigned': ['Investigating', 'Resolved'],
            'Investigating': ['Resolved'],
            'Resolved': [] # Terminal state
        }
        
        incident = self.incidents.get(incident_id)
        if not incident:
            return None
            
        current = incident.status
        # In a real system, we'd enforce the state machine. Here we just update it.
        incident.status = new_status
        incident.timeline.append({
            'timestamp': datetime.utcnow(),
            'action': 'Status changed',
            'details': f'Status changed from {current} to {new_status} by {user_id}'
        })
        return incident

    async def get_incident_timeline(self, incident_id: str) -> List[Dict[str, Any]]:
        incident = self.incidents.get(incident_id)
        if not incident:
            return []
        return incident.timeline

    async def link_evidence(self, incident_id: str, evidence_id: str) -> Optional[Incident]:
        incident = self.incidents.get(incident_id)
        if not incident:
            return None
        if not hasattr(incident, 'evidence_ids'):
            incident.evidence_ids = []
        incident.evidence_ids.append(evidence_id)
        incident.timeline.append({
            'timestamp': datetime.utcnow(),
            'action': 'Evidence linked',
            'details': f'Evidence {evidence_id} linked to incident'
        })
        return incident

    def generate_incident_id(self) -> str:
        self.incident_counter += 1
        return f'INC-{self.incident_counter:04d}'
