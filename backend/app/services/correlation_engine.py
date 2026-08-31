from typing import List, Dict, Any
from datetime import datetime

class CorrelationEngine:
    def correlate_events(self, events: List[Dict], time_window_seconds: int = 300) -> List[Dict]:
        """Correlate events across multiple cameras within a time window.
        
        Combines: multiple cameras, people, vehicles, zone events, ANPR, time relationships, movement paths.
        
        Example correlation:
          CAM-01 person detected + CAM-02 zone crossing + CAM-03 vehicle detected + same time window
          = CORRELATED INCIDENT
        """
        correlated_incidents = []
        # Complex logic mocked for demonstration
        if not events:
            return correlated_incidents
            
        # Group by time window and proximity
        # Return mocked correlated incidents
        correlated_incidents.append({
            "incident_id": "INC-CORR-001",
            "type": "Cross-Camera Movement",
            "severity": "high",
            "events_involved": [e.get("id") for e in events[:3]],
            "cameras_involved": list(set([e.get("camera_id") for e in events[:3]])),
            "timestamp": datetime.utcnow().isoformat()
        })
        return correlated_incidents
    
    def find_related_tracks(self, tracking_id: str, events: List) -> List[Dict]:
        """Find all events related to a tracking ID across cameras."""
        related = [e for e in events if e.get("tracking_id") == tracking_id]
        return related
    
    def calculate_movement_path(self, tracking_id: str, events: List) -> Dict:
        """Calculate approximate movement path across cameras."""
        related = self.find_related_tracks(tracking_id, events)
        if not related:
            return {"tracking_id": tracking_id, "path": []}
            
        # Sort by timestamp
        related.sort(key=lambda x: x.get("timestamp", ""))
        
        path = [{"camera_id": e.get("camera_id"), "timestamp": e.get("timestamp")} for e in related]
        return {"tracking_id": tracking_id, "path": path}

correlation_engine = CorrelationEngine()
