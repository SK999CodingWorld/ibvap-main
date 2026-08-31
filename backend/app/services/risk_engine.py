import math
from typing import List, Dict, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime, timezone

class RiskFactor:
    def __init__(self, name: str, score: int, description: str, category: str):
        self.name = name
        self.score = score
        self.description = description
        self.category = category

    def __getitem__(self, key):
        return getattr(self, key)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "score": self.score,
            "description": self.description,
            "category": self.category
        }

class RiskAssessment:
    """
    Hybrid assessment class supporting both object attribute access (.total_score)
    and dictionary key access (['score']) for complete backward compatibility.
    """
    def __init__(
        self,
        total_score: int,
        severity: str,
        factors: List[RiskFactor],
        confidence: float,
        dwell_time: float,
        object_type: str,
        zone: Optional[str] = None,
        tracking_id: Optional[str] = None,
        camera_id: str = "BOP-01",
        timestamp: Optional[datetime] = None
    ):
        self.total_score = total_score
        self.score = total_score
        self.severity = severity
        self.factors = factors
        self.confidence = confidence
        self.dwell_time = dwell_time
        self.object_type = object_type
        self.zone = zone
        self.tracking_id = tracking_id
        self.camera_id = camera_id
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def __getitem__(self, item):
        if item == "score" or item == "total_score":
            return self.total_score
        if item == "factors":
            return [f.to_dict() if isinstance(f, RiskFactor) else f for f in self.factors]
        return getattr(self, item, None)

    def get(self, item, default=None):
        try:
            return self[item]
        except Exception:
            return default

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.total_score,
            "total_score": self.total_score,
            "severity": self.severity,
            "factors": [f.to_dict() if isinstance(f, RiskFactor) else f for f in self.factors],
            "confidence": self.confidence,
            "dwell_time": self.dwell_time,
            "object_type": self.object_type,
            "zone": self.zone,
            "tracking_id": self.tracking_id,
            "camera_id": self.camera_id
        }

class RiskEngine:
    """
    Explainable, Continuous Multi-Variate Threat Risk Scoring Engine
    
    Dynamically computes risk scores (0-100) based on continuous mathematical
    correlation between model confidence, temporal dwell-time, zone sensitivity,
    object threat classification, and behavioral motion dynamics.
    """
    
    def __init__(self):
        # Base threat scores per object class
        self.object_base_threats = {
            'weapon': 50,
            'knife': 50,
            'gun': 55,
            'pistol': 55,
            'blacklist_person': 48,
            'abandoned_object': 32,
            'backpack': 28,
            'suitcase': 28,
            'person': 24,
            'vehicle': 20,
            'car': 20,
            'truck': 24,
            'bus': 24,
            'motorcycle': 22,
            'animal': 8
        }
        
        # Zone criticality multipliers & base contributions
        self.zone_tiers = {
            'red': {'base': 26, 'multiplier': 1.25},
            'restricted': {'base': 26, 'multiplier': 1.25},
            'perimeter': {'base': 22, 'multiplier': 1.15},
            'buffer': {'base': 14, 'multiplier': 1.00},
            'yellow': {'base': 14, 'multiplier': 1.00},
            'concourse': {'base': 8, 'multiplier': 0.85},
            'green': {'base': 4, 'multiplier': 0.70},
            'public': {'base': 4, 'multiplier': 0.70}
        }

    def calculate_risk(
        self,
        context_or_object_type: Union[Dict[str, Any], str] = "person",
        confidence: Optional[float] = None,
        zone_name: Optional[str] = None,
        dwell_time: float = 0.0,
        speed: float = 0.0,
        behavior_type: Optional[str] = None,
        is_night: bool = False,
        is_blacklist: bool = False,
        is_overspeeding: bool = False,
        **kwargs
    ) -> RiskAssessment:
        """
        Calculates a dynamic, continuous risk score (0-100) factoring in:
        - Model detection confidence
        - Temporal dwell-time curve
        - Zone sensitivity tier
        - Object type severity
        - Behavioral motion dynamics (fight, fall, loiter, overspeed)
        
        Accepts either a single context dict or positional/keyword arguments.
        """
        # Handle dict input (e.g. from unit tests or legacy callers)
        if isinstance(context_or_object_type, dict):
            ctx = context_or_object_type
            obj_type = ctx.get('object_type', 'person')
            conf = ctx.get('confidence', 0.95)
            zone = ctx.get('zone', 'Sector 4 Red Perimeter')
            dwell = ctx.get('duration_seconds', ctx.get('dwell_time', 0.0))
            spd = ctx.get('speed', 0.0)
            night = ctx.get('is_night', False)
            auth = ctx.get('is_authorized', False)
            trk_id = ctx.get('tracking_id')
            cam_id = ctx.get('camera_id', 'BOP-01')
            zone_rest = ctx.get('zone_restricted', False)
        else:
            obj_type = str(context_or_object_type)
            conf = confidence if confidence is not None else 85.0
            zone = zone_name or "Sector 4 Red Perimeter"
            dwell = dwell_time
            spd = speed
            night = is_night
            auth = kwargs.get('is_authorized', False)
            trk_id = kwargs.get('tracking_id')
            cam_id = kwargs.get('camera_id', 'BOP-01')
            zone_rest = kwargs.get('zone_restricted', 'red' in zone.lower() or 'restricted' in zone.lower())

        factors: List[RiskFactor] = []
        raw_score = 0.0
        
        # Normalize confidence to [0.0, 1.0]
        conf_ratio = max(0.1, min(1.0, conf / 100.0 if conf > 1.0 else conf))
        
        # 1. Object Type Base Threat
        obj_key = obj_type.lower()
        base_obj_score = self.object_base_threats.get(obj_key, 18)
        if is_blacklist:
            base_obj_score = 50
            
        factors.append(RiskFactor(
            name=f"Target Class: {obj_type.upper()}",
            score=base_obj_score,
            description=f"Baseline classification threat level for {obj_type}",
            category="object"
        ))
        raw_score += base_obj_score

        # 2. Zone Sensitivity Factor
        zone_lower = (zone or "").lower()
        matched_tier = self.zone_tiers['public']
        for k, v in self.zone_tiers.items():
            if k in zone_lower or (zone_rest and k in ['red', 'restricted']):
                matched_tier = v
                break
                
        factors.append(RiskFactor(
            name="Restricted Zone" if zone_rest or "restricted" in zone_lower else "Zone Sensitivity",
            score=matched_tier['base'],
            description=f"Presence in {zone}",
            category="zone"
        ))
        raw_score += matched_tier['base']

        # 3. Continuous Dwell Time Curve (Logarithmic Saturation)
        if dwell > 0:
            dwell_points = round(25.0 * (1.0 - math.exp(-max(0.0, float(dwell)) / 14.0)))
            if dwell_points > 0:
                factors.append(RiskFactor(
                    name=f"Dwell Duration ({float(dwell):.1f}s)",
                    score=dwell_points,
                    description=f"Cumulative dwell time of {float(dwell):.1f}s in restricted perimeter",
                    category="behavior"
                ))
                raw_score += dwell_points

        # 4. Behavioral & Anomaly Modifiers
        if behavior_type:
            b_lower = behavior_type.lower()
            if "fight" in b_lower or "aggression" in b_lower:
                factors.append(RiskFactor(name="Physical Altercation", score=32, description="Rapid convergence with high motion variance", category="behavior"))
                raw_score += 32
            elif "fall" in b_lower:
                factors.append(RiskFactor(name="Fall Anomaly", score=24, description="Sudden horizontal aspect-ratio collapse", category="behavior"))
                raw_score += 24
            elif "weapon" in b_lower:
                factors.append(RiskFactor(name="Lethal Weapon Proximity", score=35, description="Brandished weapon detected in active sector", category="behavior"))
                raw_score += 35
            elif "loiter" in b_lower:
                factors.append(RiskFactor(name="Stationary Loitering", score=14, description="Subject stationary within localized radius", category="behavior"))
                raw_score += 14

        if is_overspeeding or spd > 40.0:
            speed_pts = min(25, round((spd - 30.0) * 0.8))
            factors.append(RiskFactor(
                name=f"Overspeeding ({spd:.0f} km/h)",
                score=max(12, speed_pts),
                description="Vehicular velocity exceeds authorized speed limit",
                category="behavior"
            ))
            raw_score += max(12, speed_pts)

        if night:
            factors.append(RiskFactor(name="Night Movement", score=16, description="Activity detected during zero-visibility night hours", category="time"))
            raw_score += 16

        # Authorized deduction
        if auth:
            factors.append(RiskFactor(name="Authorized Clearance", score=-25, description="Target verified on authorized list", category="context"))
            raw_score -= 25

        # 5. Continuous Confidence Scaling
        conf_multiplier = 0.38 + 0.62 * conf_ratio
        
        # Apply confidence scaling to total raw score
        final_score = round(raw_score * conf_multiplier)
        final_score = max(5, min(100, final_score))

        # Add confidence modulation factor to explanation breakdown
        conf_delta = final_score - round(raw_score)
        factors.append(RiskFactor(
            name=f"Confidence Scaling ({conf_ratio*100:.1f}%)",
            score=conf_delta,
            description=f"Score modulated by detection model confidence ({conf_ratio*100:.1f}%)",
            category="confidence"
        ))

        severity = self.classify_severity(final_score)

        return RiskAssessment(
            total_score=final_score,
            severity=severity,
            factors=factors,
            confidence=round(conf_ratio * 100, 1),
            dwell_time=round(float(dwell), 1),
            object_type=obj_type,
            zone=zone,
            tracking_id=trk_id,
            camera_id=cam_id
        )

    def classify_severity(self, score: int) -> str:
        if score >= 80:
            return "CRITICAL"
        if score >= 56:
            return "HIGH"
        if score >= 28:
            return "MEDIUM"
        return "LOW"

risk_engine = RiskEngine()
