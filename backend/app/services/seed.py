import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.models.camera import Camera, CameraHealth
from app.models.zone import Zone
from app.models.alert import Alert
from app.models.incident import Incident
from app.core.security import get_password_hash
from app.core.config import settings
import random
from datetime import datetime, timedelta

async def seed_db(db: AsyncSession):
    # Check if we already seeded
    existing_users = (await db.execute(select(User))).scalars().all()
    if existing_users:
        return

    print("Seeding database with demo data...")
    
    # 1. Users
    users_data = [
        {"username": "admin", "role": "admin", "email": "admin@ibvap.local", "full_name": "System Admin"},
        {"username": "commander01", "role": "commander", "email": "cmd01@ibvap.local", "full_name": "Border Commander"},
        {"username": "operator01", "role": "operator", "email": "op01@ibvap.local", "full_name": "Watch Operator 1"},
        {"username": "analyst01", "role": "analyst", "email": "an01@ibvap.local", "full_name": "Intelligence Analyst"},
        {"username": "auditor01", "role": "auditor", "email": "aud01@ibvap.local", "full_name": "Security Auditor"},
    ]
    
    for u in users_data:
        pwd = settings.DEMO_ADMIN_PASSWORD if u["username"] == "admin" else f"{u['username']}123"
        db.add(User(
            username=u["username"],
            email=u["email"],
            hashed_password=get_password_hash(pwd),
            full_name=u["full_name"],
            role=u["role"]
        ))
    await db.commit()

    # 2. Cameras
    cameras_data = [
        ("BOP-01", "Border Outpost 1 PTZ", "Sector North", 28.6139, 77.2090, "PTZ"),
        ("BOP-02", "Border Outpost 2 Thermal", "Sector North", 28.6145, 77.2095, "Thermal"),
        ("BOP-03", "Border Outpost 3 Fixed", "Sector North", 28.6150, 77.2100, "Fixed"),
        ("CHECK-01", "Checkpoint Alpha", "Highway Access", 28.6160, 77.2150, "Fixed"),
        ("ROAD-01", "Approach Road View", "Highway Access", 28.6170, 77.2160, "PTZ"),
        ("ROAD-02", "Approach Road ANPR", "Highway Access", 28.6175, 77.2165, "ANPR"),
        ("GATE-01", "Main Gate Entry", "HQ", 28.6200, 77.2200, "Fixed"),
        ("WATCH-01", "Watchtower East", "Sector East", 28.6210, 77.2210, "PTZ"),
    ]
    
    cameras = []
    for cid, name, loc, lat, lon, ctype in cameras_data:
        c = Camera(
            camera_id=cid, name=name, location=loc, latitude=lat, longitude=lon,
            rtsp_url=f"rtsp://demo.local/{cid}", resolution="1080p", fps=30,
            camera_type=ctype, status="online", night_vision=True, onvif_support=True
        )
        db.add(c)
        cameras.append(c)
    await db.commit()

    # 3. Camera Health
    for c in cameras:
        db.add(CameraHealth(
            camera_id=c.id, stream_status="active", fps_actual=29.5,
            latency_ms=random.randint(20, 100), signal_quality=random.randint(85, 100),
            ai_status="processing", health_score=random.randint(90, 100),
            issues=json.dumps([])
        ))
    await db.commit()

    # 4. Zones
    z = Zone(name="No Go Zone", camera_id=cameras[0].id, zone_type="polygon", 
             coordinates=json.dumps([[100, 100], [200, 100], [200, 200], [100, 200]]), 
             alert_severity="critical")
    db.add(z)
    await db.commit()

    # 5. Alerts & Incidents
    a = Alert(alert_id="ALT-0001", severity="critical", type="zone_intrusion", 
              camera_id=cameras[0].id, object_type="person", confidence=0.95, risk_score=9.8)
    db.add(a)
    await db.commit()

    inc = Incident(incident_id="INC-0001", severity="critical", location="Sector North",
                   trigger="Multiple zone intrusions", risk_score=9.8, camera_ids=json.dumps([cameras[0].id]),
                   notes=json.dumps(["Initial detection verified by operator."]),
                   timeline=json.dumps([{"time": datetime.utcnow().isoformat(), "event": "Created"}]))
    db.add(inc)
    await db.commit()
    
    print("Database seeding completed.")
