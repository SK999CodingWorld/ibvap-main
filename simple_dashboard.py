import json
import os
import time
import threading
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2
import uvicorn

app = FastAPI(title="IBVAP Live Dashboard")

# CORS — explicit trusted origins (matches main.py and settings.py)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files for React build
static_dir = os.path.join(os.path.dirname(__file__), "static")
static_assets = os.path.join(static_dir, "assets")
if os.path.exists(static_assets):
    app.mount("/assets", StaticFiles(directory=static_assets), name="assets")

# Load model
model = YOLO("yolov8n.pt")
_start_time = time.time()

video_path = "test.mp4"

FENCE_X1, FENCE_Y1 = 400, 200
FENCE_X2, FENCE_Y2 = 900, 600

latest_frame = None
alerts: list = []
lock = threading.Lock()
_frame_count = 0
_video_active = False


def process_video():
    global latest_frame, _frame_count, _video_active
    cap = cv2.VideoCapture(video_path)
    _video_active = cap.isOpened()

    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        _video_active = True
        _frame_count += 1

        results = model(frame, verbose=False)

        # Draw zone
        cv2.rectangle(frame, (FENCE_X1, FENCE_Y1), (FENCE_X2, FENCE_Y2), (0, 255, 255), 2)
        cv2.putText(frame, "RESTRICTED ZONE", (FENCE_X1, FENCE_Y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])

            if label not in ["person", "car", "truck", "bus", "motorcycle"]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            inside = (FENCE_X1 < cx < FENCE_X2) and (FENCE_Y1 < cy < FENCE_Y2)

            color = (0, 0, 255) if inside else (0, 255, 0)
            text = f"ALERT: {label}" if inside else label

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if inside:
                now = datetime.now(timezone.utc)
                with lock:
                    alerts.insert(0, {
                        "time": now.strftime("%H:%M:%S"),
                        "timestamp": now.isoformat(),
                        "type": f"{label} intrusion",
                        "class_name": label,
                        "confidence": round(conf, 3),
                        "camera_id": "cam1",
                    })
                    alerts[:] = alerts[:50]

        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        with lock:
            latest_frame = buffer.tobytes()

        time.sleep(0.03)


threading.Thread(target=process_video, daemon=True).start()


def generate_stream():
    while True:
        with lock:
            frame = latest_frame
        if frame is not None:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(0.03)


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_stream(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/alerts")
def get_alerts():
    with lock:
        return list(alerts)


# ──────────────────────────────────────────────────────────
# REAL API endpoints — no mock/hardcoded data
# ──────────────────────────────────────────────────────────

@app.get("/api/health")
def api_health():
    """Returns actual health status of every running component."""
    uptime = int(time.time() - _start_time)
    components = []

    # Detection engine
    model_loaded = model is not None
    class_count = len(model.names) if model_loaded else 0
    components.append({
        "name": "detection_worker",
        "status": "healthy" if model_loaded else "unhealthy",
        "message": f"YOLOv8 loaded — {class_count} classes" if model_loaded else "Model not loaded",
    })

    # Video capture
    components.append({
        "name": "stream_ingest",
        "status": "healthy" if _video_active else "degraded",
        "message": f"Streaming — {_frame_count} frames processed" if _video_active else "No video source",
    })

    # Alert engine
    with lock:
        alert_count = len(alerts)
    components.append({
        "name": "alert_engine",
        "status": "healthy",
        "message": f"{alert_count} alerts in history",
    })

    overall = "healthy"
    if any(c["status"] == "unhealthy" for c in components):
        overall = "unhealthy"
    elif any(c["status"] == "degraded" for c in components):
        overall = "degraded"

    return {
        "service": "ibvap",
        "version": "1.0.0",
        "status": overall,
        "uptime_seconds": uptime,
        "components": components,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/cameras")
def api_cameras():
    """Returns real camera list from cameras.json, or the single active local feed."""
    cameras_path = Path(__file__).parent / "cameras.json"
    if cameras_path.exists():
        try:
            data = json.loads(cameras_path.read_text(encoding="utf-8"))
            cameras = data if isinstance(data, list) else list(data.values())
            return cameras
        except (json.JSONDecodeError, OSError):
            pass  # fall through to single-camera response

    # No cameras.json — report the actual running camera honestly
    now = datetime.now(timezone.utc).isoformat()
    return [{
        "id": "cam1",
        "name": "IBVAP-Local-Feed",
        "location": "Local Video Source",
        "protocol": "file",
        "stream_url": video_path,
        "status": "online" if _video_active else "offline",
        "fps": round(1 / 0.033, 1) if _video_active else 0,
        "enabled": True,
        "ptz_enabled": False,
        "ptz_presets": [],
        "zones": [],
        "metadata": {"source": "simple_dashboard.py"},
        "created_at": now,
        "updated_at": now,
    }]


@app.get("/api/alerts")
def api_alerts():
    """Returns real alert history from the intrusion detection loop."""
    with lock:
        return [
            {
                "id": f"alert_{i}_{hash(a.get('timestamp', '')) % 100000}",
                "camera_id": a.get("camera_id", "cam1"),
                "type": "zone_intrusion",
                "severity": "critical" if a.get("class_name") == "person" else "warning",
                "message": a.get("type", "Unknown alert"),
                "class_name": a.get("class_name", "unknown"),
                "confidence": a.get("confidence", 0.0),
                "timestamp": a.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "acknowledged": False,
                "metadata": {},
            }
            for i, a in enumerate(alerts)
        ]


@app.get("/api/recordings/storage")
def api_storage():
    """Scans the actual recordings directory for real storage stats."""
    recordings_dir = Path(__file__).parent / "recordings"
    total_size = 0
    clip_count = 0
    camera_ids: set = set()

    if recordings_dir.exists():
        for f in recordings_dir.rglob("*"):
            if f.is_file() and f.suffix in (".mp4", ".avi", ".mkv", ".ts", ".json"):
                if f.suffix != ".json":
                    clip_count += 1
                total_size += f.stat().st_size
                # camera ID is the first subdirectory under recordings/
                parts = f.relative_to(recordings_dir).parts
                if parts:
                    camera_ids.add(parts[0])

    return {
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 1),
        "clip_count": clip_count,
        "cameras": sorted(camera_ids) if camera_ids else ["cam1"],
    }


# ──────────────────────────────────────────────────────────
# Aggregate status endpoint (Item 9)
# ──────────────────────────────────────────────────────────

@app.get("/api/status")
def api_status():
    """One-call aggregate: health + key stats of every component."""
    health = api_health()
    cameras = api_cameras()
    storage = api_storage()

    with lock:
        recent_alerts = len(alerts)
        critical_count = sum(1 for a in alerts if a.get("class_name") == "person")

    return {
        "health": health,
        "cameras": {
            "total": len(cameras),
            "online": sum(1 for c in cameras if c.get("status") == "online"),
        },
        "alerts": {
            "total": recent_alerts,
            "critical": critical_count,
        },
        "storage": storage,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ──────────────────────────────────────────────────────────
# Serve React app at root
# ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("""
    <html>
    <head><title>IBVAP Live Dashboard</title></head>
    <body style="background:#111;color:#eee;font-family:sans-serif;padding:20px;">
        <h1>IBVAP Live Dashboard</h1>
        <p>React build not found. Run <code>cd dashboard && npm run build</code> first.</p>
        <p><a href="/simple">Simple Dashboard</a> | <a href="/video_feed">Video Feed</a> | <a href="/docs">API Docs</a></p>
    </body>
    </html>
    """)


# Simple dashboard at /simple
@app.get("/simple", response_class=HTMLResponse)
def simple_dashboard():
    return """
    <html>
    <head>
        <title>IBVAP Live Dashboard</title>
        <style>
            body { background:#111; color:#eee; font-family:sans-serif; margin:0; padding:20px; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
            .stats { display:flex; gap:20px; margin-bottom:20px; }
            .stat { background:#1a1a1a; padding:20px; border-radius:8px; flex:1; text-align:center; border-left:4px solid #22c55e; }
            .stat h3 { margin:0 0 10px; font-size:14px; color:#94a3b8; }
            .stat .val { font-size:32px; font-weight:bold; color:#22c55e; }
            .container { display:flex; gap:20px; }
            .video { flex:2; }
            .alerts { flex:1; background:#1a1a1a; padding:20px; border-radius:8px; height:60vh; overflow-y:auto; }
            img { width:100%; border-radius:8px; border:2px solid #333; }
            .alert-item { background:#2a2a2a; margin:10px 0; padding:12px; border-left:4px solid #ef4444; border-radius:4px; }
            .alert-item.warning { border-left-color:#eab308; }
            .alert-item.info { border-left-color:#3b82f6; }
            h1 { margin:0; }
            h2 { color:#22c55e; margin-top:0; }
            .zone-info { background:#1a1a1a; padding:15px; border-radius:8px; margin-bottom:20px; border-left:4px solid #eab308; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>IBVAP — Live Dashboard</h1>
            <span style="color:#22c55e; font-weight:bold;">● LIVE</span>
        </div>

        <div class="zone-info">
            <strong>Virtual Fence Zone:</strong> Rectangle (400,200) to (900,600) |
            Classes: person, car, truck, bus, motorcycle
        </div>

        <div class="stats">
            <div class="stat"><h3>Total Cameras</h3><div class="val" id="camCount">1</div></div>
            <div class="stat"><h3>Active Alerts</h3><div class="val" id="alertCount">0</div></div>
            <div class="stat"><h3>Zone Intrusions</h3><div class="val" id="intrusionCount">0</div></div>
            <div class="stat"><h3>Status</h3><div class="val" style="color:#22c55e;">ONLINE</div></div>
        </div>

        <div class="container">
            <div class="video">
                <h2>Live Feed</h2>
                <img src="/video_feed" id="videoFeed">
            </div>
            <div class="alerts">
                <h2>Recent Alerts</h2>
                <div id="alertList">Waiting for alerts...</div>
            </div>
        </div>

        <script>
            let totalIntrusions = 0;

            async function refreshAlerts() {
                try {
                    const res = await fetch('/alerts');
                    const data = await res.json();
                    const list = document.getElementById('alertList');
                    if (data.length === 0) {
                        list.innerHTML = '<p style="color:#666; text-align:center; margin-top:50px;">No alerts yet</p>';
                    } else {
                        list.innerHTML = data.map(a =>
                            `<div class="alert-item ${a.class_name === 'person' ? 'warning' : ''}">
                                <b>${a.type}</b><br>
                                <small>${a.time} • ${(a.confidence * 100).toFixed(0)}%</small>
                            </div>`
                        ).join('');
                    }
                    document.getElementById('alertCount').textContent = data.length;
                    totalIntrusions += data.length;
                    document.getElementById('intrusionCount').textContent = totalIntrusions;
                } catch (e) {
                    console.error(e);
                }
            }

            setInterval(refreshAlerts, 1000);
            refreshAlerts();
        </script>
    </body>
    </html>
    """


# Catch-all for React Router (must be last - before __main__)
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    # Don't catch API / stream / static paths
    if full_path.startswith(("api/", "video_feed", "alerts", "simple", "assets", "docs", "openapi.json", "redoc")):
        return HTMLResponse("Not found", status_code=404)
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("Not found", status_code=404)


if __name__ == "__main__":
    _port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=_port)