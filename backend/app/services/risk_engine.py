from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class RiskFactor:
    name: str
    score: int  # contribution to total
    description: str
    category: str  # zone, time, behavior, correlation, context

@dataclass 
class RiskAssessment:
    total_score: int  # 0-100
    severity: str  # INFO/LOW/MEDIUM/HIGH/CRITICAL  
    factors: List[RiskFactor]
    timestamp: datetime
    object_type: str
    tracking_id: Optional[str]
    camera_id: str
    zone: Optional[str]

class RiskEngine:
    """Explainable risk scoring engine.
    
    Every risk score has clear, auditable reasons.
    Score ranges:
      0-20:  INFO
      21-40: LOW  
      41-60: MEDIUM
      61-80: HIGH
      81-100: CRITICAL
    """
    
    def __init__(self):
        self.thresholds = {
            'restricted_zone': 30,
            'restricted_hours': 20,
            'movement_toward_protected': 15,
            'loitering': 12,
            'multi_object_correlation': 10,
            'night_movement': 15,
            'high_speed': 8,
            'zone_crossing': 10,
            'camera_sequence': 5,
            'low_confidence': -10,
            'known_vehicle': -15,
            'authorized_entry': -20,
        }
    
    def calculate_risk(self, context: Dict[str, Any]) -> RiskAssessment:
        """Calculate risk score with full factor breakdown.
        
        Context dict should contain:
        - object_type: str
        - zone: str (zone name or None)
        - zone_restricted: bool
        - time: datetime
        - is_night: bool
        - direction: str
        - duration_seconds: int (how long in zone)
        - speed: float
        - nearby_objects: int
        - camera_id: str
        - tracking_id: str
        - confidence: float
        - cameras_seen: list (for cross-camera)
        - is_authorized: bool
        """
        factors: List[RiskFactor] = []
        
        # 1. Zone Factors
        if context.get('zone_restricted', False):
            factors.append(RiskFactor(
                name="Restricted Zone",
                score=self.thresholds['restricted_zone'],
                description=f"Object detected in restricted zone: {context.get('zone')}",
                category="zone"
            ))
            
        # 2. Time Factors
        if context.get('is_night', False):
            factors.append(RiskFactor(
                name="Night Movement",
                score=self.thresholds['night_movement'],
                description="Movement detected during nighttime hours",
                category="time"
            ))
            
        # 3. Behavior Factors
        duration = context.get('duration_seconds', 0)
        if duration > 30: # 30 seconds threshold for loitering
            factors.append(RiskFactor(
                name="Loitering",
                score=self.thresholds['loitering'],
                description=f"Object loitering in area for {duration} seconds",
                category="behavior"
            ))
            
        speed = context.get('speed', 0.0)
        if speed > 10.0: # Arbitrary high speed threshold
            factors.append(RiskFactor(
                name="High Speed",
                score=self.thresholds['high_speed'],
                description=f"Object moving at high speed ({speed:.1f} m/s)",
                category="behavior"
            ))
            
        direction = context.get('direction', '')
        if direction.lower() in ['inbound', 'towards_base', 'approaching']:
            factors.append(RiskFactor(
                name="Movement Toward Protected Area",
                score=self.thresholds['movement_toward_protected'],
                description="Object trajectory is toward protected installation",
                category="behavior"
            ))
            
        # 4. Correlation Factors
        nearby = context.get('nearby_objects', 0)
        if nearby > 2:
            factors.append(RiskFactor(
                name="Multiple Objects",
                score=self.thresholds['multi_object_correlation'],
                description=f"Object is moving with {nearby} other objects",
                category="correlation"
            ))
            
        cameras_seen = context.get('cameras_seen', [])
        if len(cameras_seen) > 1:
            factors.append(RiskFactor(
                name="Cross-Camera Tracking",
                score=self.thresholds['camera_sequence'],
                description=f"Object tracked across {len(cameras_seen)} cameras",
                category="correlation"
            ))
            
        # 5. Context / Modifiers
        if context.get('is_authorized', False):
            factors.append(RiskFactor(
                name="Authorized Entry",
                score=self.thresholds['authorized_entry'],
                description="Object is authorized for this area/time",
                category="context"
            ))
            
        confidence = context.get('confidence', 1.0)
        if confidence < 0.6:
            factors.append(RiskFactor(
                name="Low Confidence",
                score=self.thresholds['low_confidence'],
                description=f"Detection confidence is low ({confidence:.0%})",
                category="context"
            ))
            
        # Calculate total score
        total_score = sum(f.score for f in factors)
        # Clamp between 0 and 100
        total_score = max(0, min(100, total_score))
        
        return RiskAssessment(
            total_score=total_score,
            severity=self.classify_severity(total_score),
            factors=factors,
            timestamp=context.get('time', datetime.utcnow()),
            object_type=context.get('object_type', 'unknown'),
            tracking_id=context.get('tracking_id'),
            camera_id=context.get('camera_id', 'unknown'),
            zone=context.get('zone')
        )
    
    def classify_severity(self, score: int) -> str:
        if score >= 81: return 'CRITICAL'
        if score >= 61: return 'HIGH'
        if score >= 41: return 'MEDIUM'
        if score >= 21: return 'LOW'
        return 'INFO'
    
    def update_thresholds(self, new_thresholds: Dict[str, int]):
        self.thresholds.update(new_thresholds)
