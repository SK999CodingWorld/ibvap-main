import random
from typing import Dict, Any, List

def calculate_health_score(metrics: Dict[str, Any]) -> int:
    """Calculate an overall health score (0-100) based on metrics."""
    score = 100
    if metrics.get("fps", 30) < 20:
        score -= 20
    elif metrics.get("fps", 30) < 25:
        score -= 5
    
    if metrics.get("latency", 0) > 500:
        score -= 30
    elif metrics.get("latency", 0) > 200:
        score -= 10
        
    packet_loss = metrics.get("packet_loss", 0)
    if packet_loss > 5:
        score -= 40
    elif packet_loss > 1:
        score -= 15
        
    if not metrics.get("stream_active", True):
        score = 0
        
    return max(0, score)

def detect_camera_issues(health_data: Dict[str, Any]) -> List[str]:
    """Detect specific issues from health metrics."""
    issues = []
    if not health_data.get("stream_active", True):
        issues.append("Stream offline")
        return issues
        
    if health_data.get("fps", 30) < 15:
        issues.append("Low FPS detected")
    
    if health_data.get("latency", 0) > 400:
        issues.append("High network latency")
        
    if health_data.get("packet_loss", 0) > 2:
        issues.append("Packet loss detected")
        
    # Simulated image quality issues based on random chance for demo
    if random.random() < 0.05:
        issues.append(random.choice(["Blurry image", "Obstruction detected", "Possible tampering", "Poor lighting"]))
        
    return issues

def get_camera_health(camera_id: str) -> Dict[str, Any]:
    """Get simulated health metrics for a camera."""
    # Generate realistic-looking mock data
    is_active = random.random() > 0.05
    fps = random.randint(24, 30) if is_active else 0
    latency = random.randint(20, 150) if is_active else 0
    
    if random.random() < 0.1 and is_active:  # 10% chance of degraded performance
        fps = random.randint(10, 20)
        latency = random.randint(200, 800)
        
    metrics = {
        "camera_id": camera_id,
        "stream_active": is_active,
        "fps": fps,
        "latency": latency,
        "packet_loss": random.uniform(0, 0.5) if is_active else 100.0,
        "ai_active": is_active and random.random() > 0.05,
    }
    
    metrics["score"] = calculate_health_score(metrics)
    metrics["issues"] = detect_camera_issues(metrics)
    
    return metrics
