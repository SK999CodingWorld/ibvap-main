from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import os

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
import app.models
from app.api import auth, users, dashboard
from app.services.seed import seed_db
from app.ai.realtime_stream import live_stream_processor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    if settings.DEMO_MODE:
        async with AsyncSessionLocal() as session:
            await seed_db(session)
    
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(title="IBVAP - Intelligent Border Video Analytics Platform", lifespan=lifespan)

# Filter out wildcard if present to maintain strict W3C CORS compliance with allow_credentials=True
trusted_origins = [orig for orig in settings.CORS_ORIGINS if orig != "*"]
if not trusted_origins:
    trusted_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=trusted_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)

from app.api import (
    cameras, simulation, detections, tracking, anpr, zones, faces, map, evidence, 
    audit, security, alerts, incidents, edge, analytics, system, notifications, search,
    video_intelligence, ai_models
)
from app.api import settings as settings_api

app.include_router(cameras.router)
app.include_router(simulation.router)
app.include_router(detections.router)
app.include_router(tracking.router)
app.include_router(anpr.router)
app.include_router(zones.router)
app.include_router(faces.router)
app.include_router(map.router)
app.include_router(evidence.router)
app.include_router(audit.router)
app.include_router(security.router)
app.include_router(alerts.router)
app.include_router(incidents.router)
app.include_router(edge.router)
app.include_router(analytics.router)
app.include_router(system.router)
app.include_router(settings_api.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(video_intelligence.router)
app.include_router(ai_models.router)

@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "IBVAP Enterprise Surveillance",
        "version": "1.0.0",
        "demo_mode": settings.DEMO_MODE,
        "ai_engine": "YOLOv8 + ByteTrack + PaddleOCR + RetinaFace"
    }

# Live Real-time AI Video Feed (MJPEG)
@app.get("/video_feed", tags=["stream"])
@app.get("/api/stream/feed", tags=["stream"])
def video_feed():
    """Real-time MJPEG live stream with annotated YOLO & ByteTrack overlays"""
    return StreamingResponse(
        live_stream_processor.generate_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# Cumulative Foot Traffic Heatmap Stream
@app.get("/heatmap", tags=["stream"])
@app.get("/api/stream/heatmap", tags=["stream"])
def heatmap_feed():
    """Cumulative foot-traffic motion heatmap MJPEG stream"""
    return StreamingResponse(
        live_stream_processor.generate_heatmap_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/stream/density", tags=["stream"])
def get_crowd_density():
    """Returns zone crowd count, total persons, and overcrowding status"""
    return live_stream_processor.get_density_metrics()

@app.post("/api/density/threshold", tags=["stream"])
def set_crowd_threshold(payload: dict):
    """Configures the overcrowding threshold limit"""
    thresh = int(payload.get("threshold", 6))
    return live_stream_processor.set_crowd_threshold(thresh)

@app.post("/api/heatmap/reset", tags=["stream"])
def reset_heatmap():
    """Resets the accumulated movement heatmap"""
    return live_stream_processor.reset_heatmap()

# Low-Light & Night-Vision Enhancement Control API
@app.get("/api/stream/enhancer", tags=["stream"])
async def get_enhancer_status():
    """Returns low-light preprocessor status, current brightness, latency, and FPS"""
    from app.ai.enhancer import low_light_enhancer
    status = low_light_enhancer.get_status()
    status["fps"] = round(getattr(live_stream_processor, "fps", 30.0), 1)
    return status

@app.post("/api/stream/enhancer", tags=["stream"])
async def configure_enhancer(payload: dict):
    """Toggles or configures low-light CLAHE enhancement preprocessor"""
    from app.ai.enhancer import low_light_enhancer
    enabled = payload.get("enabled")
    threshold = payload.get("threshold")
    clip_limit = payload.get("clip_limit")
    return low_light_enhancer.set_config(enabled=enabled, threshold=threshold, clip_limit=clip_limit)

# Edge Performance & Multi-Rate Inference Optimization API
@app.get("/api/stream/performance", tags=["stream"])
async def get_performance_stats():
    """Returns frame-skip, inference resolution, and active FPS telemetry"""
    return live_stream_processor.get_performance_config()

@app.post("/api/stream/performance", tags=["stream"])
async def configure_performance(payload: dict):
    """Configures edge frame-skip (N) and downscaled inference resolution"""
    frame_skip = payload.get("frame_skip")
    infer_width = payload.get("infer_width")
    infer_height = payload.get("infer_height")
    return live_stream_processor.set_performance_config(
        frame_skip=frame_skip, infer_width=infer_width, infer_height=infer_height
    )

@app.get("/api/stream/alerts", tags=["stream"])
def stream_alerts():
    return live_stream_processor.get_live_alerts()

@app.get("/api/stream/snapshot", tags=["stream"])
def get_stream_snapshot():
    """Returns a single clean JPEG frame for 4-point zone polygon calibration"""
    from fastapi.responses import Response
    return Response(
        content=live_stream_processor.get_raw_snapshot(),
        media_type="image/jpeg"
    )

@app.get("/api/stream/zone", tags=["stream"])
def get_zone_polygon():
    """Returns the active 4-point restricted zone polygon coordinates"""
    return live_stream_processor.get_zone_polygon()

@app.post("/api/stream/zone", tags=["stream"])
def update_zone_polygon(payload: dict):
    """Updates the restricted zone polygon from the interactive UI setup mode"""
    polygon = payload.get("polygon", [])
    if len(polygon) < 3:
        return {"status": "error", "message": "At least 3 points required"}
    updated = live_stream_processor.set_zone_polygon(polygon)
    return {"status": "success", "polygon": updated}

@app.get("/api/stream/source", tags=["stream"])
def get_stream_source():
    """Returns the current streaming video or webcam source"""
    return live_stream_processor.get_source_info()

@app.post("/api/stream/source", tags=["stream"])
def set_stream_source(payload: dict):
    """Switches stream source to webcam (0), video file, or IP stream"""
    source = payload.get("source", "test.mp4")
    return live_stream_processor.set_source(source)

# Face Recognition Watchlist API
@app.get("/api/faces/watchlist", tags=["faces"])
def get_face_watchlist():
    """Returns loaded known faces and blacklist status"""
    from app.ai.face_engine import face_engine
    return face_engine.get_watchlist()

@app.post("/api/faces/reload", tags=["faces"])
def reload_face_watchlist():
    """Reloads known faces database from directory"""
    from app.ai.face_engine import face_engine
    face_engine.reload_database()
    return {"status": "success", "watchlist": face_engine.get_watchlist()}

# Server-Sent Events (SSE) Alerts Stream
@app.get("/api/alerts/stream", tags=["stream"])
async def sse_alerts_stream():
    """Server-Sent Events stream for live alerts sidebar"""
    async def event_generator():
        last_sent_time = None
        while True:
            alerts = live_stream_processor.get_live_alerts()
            if alerts:
                top_alert = alerts[0]
                if top_alert.get("timestamp") != last_sent_time:
                    last_sent_time = top_alert.get("timestamp")
                    yield f"data: {json.dumps(top_alert)}\n\n"
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# WebSocket for real-time events & alerts
from app.core.websocket import ws_manager

@app.websocket("/ws/events")
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Serve Compiled React UI
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dirs = [
    os.path.join(base_dir, "static"),
    os.path.join(os.path.dirname(base_dir), "static"),
    os.path.join(os.path.dirname(base_dir), "frontend", "dist")
]

static_dir = None
for s in static_dirs:
    if os.path.exists(s) and os.path.exists(os.path.join(s, "index.html")):
        static_dir = s
        break

if static_dir:
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
async def root():
    if static_dir:
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return HTMLResponse("<h1>IBVAP Enterprise Surveillance API is Running</h1><p>Visit <a href='/docs'>/docs</a> for Swagger UI</p>")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Pass through API and stream paths
    if full_path.startswith("api/") or full_path.startswith("ws/") or full_path.startswith("video_feed") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("assets/"):
        return HTMLResponse("Not Found", status_code=404)
    if static_dir:
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return HTMLResponse("Not Found", status_code=404)
