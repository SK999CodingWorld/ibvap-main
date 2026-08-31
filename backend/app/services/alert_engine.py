from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import uuid

# Define a mock Alert model for now since we don't have the SQLAlchemy models defined in the prompt.
class Alert:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        if not hasattr(self, 'status'):
            self.status = 'NEW'

class AlertEngine:
    def __init__(self, db_session, risk_engine):
        self.db = db_session
        self.risk_engine = risk_engine
        self.recent_alerts = []  # in-memory dedup buffer
        self.alert_counter = 0
    
    async def process_event(self, event: Dict[str, Any]) -> Optional[Alert]:
        """Process detection event through alert pipeline:
        Event -> Deduplication -> Correlation -> Risk Scoring -> Priority Queue
        """
        # 1. Check for duplicates
        if self._is_duplicate(event):
            return None
            
        # 3. Calculate risk score
        risk_assessment = self.risk_engine.calculate_risk(event)
        
        # 4. Generate alert if threshold met (e.g., score > 20)
        if risk_assessment.total_score <= 20:
            return None # Just info, no alert generated in this mock
            
        # 5. Create alert
        alert = Alert(
            id=self._generate_alert_id(),
            camera_id=event.get('camera_id'),
            object_type=event.get('object_type'),
            tracking_id=event.get('tracking_id'),
            risk_score=risk_assessment.total_score,
            severity=risk_assessment.severity,
            timestamp=risk_assessment.timestamp,
            factors=[vars(f) for f in risk_assessment.factors], # Store as dicts for simplicity
            status='NEW',
            type=self._determine_alert_type(risk_assessment.factors)
        )
        
        self.recent_alerts.append({
            'event': event,
            'timestamp': datetime.utcnow(),
            'alert_id': alert.id
        })
        
        # Clean up old alerts from dedup buffer
        self._cleanup_buffer()
        
        # Return alert or None (saving to DB skipped for this mock)
        return alert
        
    def _determine_alert_type(self, factors: List[Any]) -> str:
        factor_names = [f.name for f in factors]
        if 'Restricted Zone' in factor_names:
            return 'Zone Intrusion'
        if 'Loitering' in factor_names:
            return 'Loitering'
        if 'High Speed' in factor_names:
            return 'High Speed'
        return 'Suspicious Activity'
    
    async def acknowledge_alert(self, alert_id: str, user_id: int) -> Alert:
        # Mock implementation
        return Alert(id=alert_id, status='ACKNOWLEDGED')
    
    async def escalate_alert(self, alert_id: str, user_id: int) -> Alert:
        # Mock implementation
        return Alert(id=alert_id, status='ESCALATED')
    
    async def resolve_alert(self, alert_id: str, user_id: int, resolution: str) -> Alert:
        # Mock implementation
        return Alert(id=alert_id, status='RESOLVED', resolution=resolution)
    
    async def mark_false_positive(self, alert_id: str, user_id: int) -> Alert:
        # Mock implementation
        return Alert(id=alert_id, status='FALSE_POSITIVE')
    
    async def group_alerts(self, alerts: List[Alert]) -> List[Dict[str, Any]]:
        """Group related alerts. E.g., 47 detections across 3 cameras -> 1 correlated incident"""
        # Simple grouping by tracking_id for mock
        groups = {}
        for a in alerts:
            tid = getattr(a, 'tracking_id', 'unknown')
            if tid not in groups:
                groups[tid] = []
            groups[tid].append(a)
        
        return [{'tracking_id': k, 'alerts': v} for k, v in groups.items()]
    
    def _is_duplicate(self, event: Dict[str, Any]) -> bool:
        # Simple dedup: same camera, same object, within last 10 seconds
        now = datetime.utcnow()
        for item in self.recent_alerts:
            old_event = item['event']
            if (old_event.get('camera_id') == event.get('camera_id') and 
                old_event.get('tracking_id') == event.get('tracking_id')):
                if (now - item['timestamp']).total_seconds() < 10:
                    return True
        return False
        
    def _cleanup_buffer(self):
        now = datetime.utcnow()
        self.recent_alerts = [a for a in self.recent_alerts if (now - a['timestamp']).total_seconds() < 60]
    
    def _generate_alert_id(self) -> str:
        self.alert_counter += 1
        return f'ALT-{self.alert_counter:04d}'
