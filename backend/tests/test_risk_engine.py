import pytest
from datetime import datetime, timezone
from app.services.risk_engine import RiskEngine

def test_risk_engine_calculation():
    engine = RiskEngine()
    
    # Normal daytime authorized context -> low risk
    context = {
        "object_type": "person",
        "zone": "Public Access Zone",
        "zone_restricted": False,
        "time": datetime.now(timezone.utc),
        "is_night": False,
        "direction": "EAST",
        "duration_seconds": 10,
        "speed": 1.2,
        "nearby_objects": 1,
        "camera_id": "BOP-01",
        "tracking_id": "P-101",
        "confidence": 0.95,
        "cameras_seen": ["BOP-01"],
        "is_authorized": True,
    }
    
    assessment = engine.calculate_risk(context)
    assert assessment.total_score <= 40
    assert assessment.severity in ["INFO", "LOW"]

def test_risk_engine_critical_intrusion():
    engine = RiskEngine()
    
    # High threat context: night time restricted zone breach + loitering
    context = {
        "object_type": "person",
        "zone": "Restricted Sector Red",
        "zone_restricted": True,
        "time": datetime.now(timezone.utc),
        "is_night": True,
        "direction": "NORTH",
        "duration_seconds": 180,
        "speed": 0.2,
        "nearby_objects": 3,
        "camera_id": "BOP-02",
        "tracking_id": "P-104",
        "confidence": 0.96,
        "cameras_seen": ["BOP-01", "BOP-02"],
        "is_authorized": False,
    }
    
    assessment = engine.calculate_risk(context)
    assert assessment.total_score >= 60
    assert assessment.severity in ["HIGH", "CRITICAL"]
    assert len(assessment.factors) > 0
    # Check that factors explain the score
    factor_names = [f.name for f in assessment.factors]
    assert any("Restricted" in name or "Zone" in name for name in factor_names)
