import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from shared.config.settings import settings
from shared.messaging.streams import StreamManager, StreamConfig
from shared.schemas.camera import CameraCreate, CameraUpdate, PTZPreset
from shared.schemas.alert import AlertRule
from shared.schemas.health import HealthCheck, ServiceStatus, ComponentHealth

from services.stream_ingest import StreamIngestService
from services.detection_worker import DetectionWorker
from services.tracking_service import TrackingService
from services.alert_engine import AlertEngine
from services.camera_registry import CameraRegistryService
from services.recording_service import RecordingService
from services.ptz_control import PTZControlService
from services.analytics.anpr_worker import ANPRWorker
from services.analytics.face_worker import FaceWorker
from services.analytics.behavior_worker import BehaviorWorker
from services.analytics.night_enhance import NightEnhanceWorker

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class IBVAPApplication:
    def __init__(self):
        self.stream_manager: Optional[StreamManager] = None
        self.stream_ingest: Optional[StreamIngestService] = None
        self.detection_worker: Optional[DetectionWorker] = None
        self.tracking_service: Optional[TrackingService] = None
        self.alert_engine: Optional[AlertEngine] = None
        self.camera_registry: Optional[CameraRegistryService] = None
        self.recording_service: Optional[RecordingService] = None
        self.ptz_service: Optional[PTZControlService] = None
        self.anpr_worker: Optional[ANPRWorker] = None
        self.face_worker: Optional[FaceWorker] = None
        self.behavior_worker: Optional[BehaviorWorker] = None
        self.night_worker: Optional[NightEnhanceWorker] = None
        self._running = False

    async def startup(self):
        logger.info("Starting IBVAP Application...")

        stream_config = StreamConfig(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            password=settings.redis_password,
        )
        self.stream_manager = StreamManager(stream_config)
        await self.stream_manager.connect()

        self.camera_registry = CameraRegistryService(self.stream_manager)
        self.stream_ingest = StreamIngestService()
        self.stream_ingest.stream_manager = self.stream_manager
        self.stream_ingest.camera_manager.stream_manager = self.stream_manager

        self.detection_worker = DetectionWorker(self.stream_manager)
        self.tracking_service = TrackingService(self.stream_manager)
        self.alert_engine = AlertEngine(self.stream_manager)
        self.recording_service = RecordingService(self.stream_manager)
        self.ptz_service = PTZControlService()
        self.anpr_worker = ANPRWorker(self.stream_manager)
        self.face_worker = FaceWorker(self.stream_manager)
        self.behavior_worker = BehaviorWorker(self.stream_manager)
        self.night_worker = NightEnhanceWorker(self.stream_manager)

        await self.stream_ingest.start()
        await self.detection_worker.start()
        await self.tracking_service.start()
        await self.alert_engine.start()
        await self.recording_service.start()
        await self.anpr_worker.start()
        await self.face_worker.start()
        await self.behavior_worker.start()
        await self.night_worker.start()

        self._running = True
        logger.info("IBVAP Application started successfully")

    async def shutdown(self):
        logger.info("Shutting down IBVAP Application...")
        self._running = False

        if self.night_worker:
            await self.night_worker.stop()
        if self.behavior_worker:
            await self.behavior_worker.stop()
        if self.face_worker:
            await self.face_worker.stop()
        if self.anpr_worker:
            await self.anpr_worker.stop()
        if self.recording_service:
            await self.recording_service.stop()
        if self.alert_engine:
            await self.alert_engine.stop()
        if self.tracking_service:
            await self.tracking_service.stop()
        if self.detection_worker:
            await self.detection_worker.stop()
        if self.stream_ingest:
            await self.stream_ingest.stop()
        if self.stream_manager:
            await self.stream_manager.disconnect()

        logger.info("IBVAP Application shutdown complete")

    @property
    def health(self) -> HealthCheck:
        components = []

        if self.stream_manager:
            try:
                components.append(ComponentHealth(
                    name="redis",
                    status=ServiceStatus.HEALTHY,
                    message="Connected",
                ))
            except:
                components.append(ComponentHealth(
                    name="redis",
                    status=ServiceStatus.UNHEALTHY,
                    message="Disconnected",
                ))

        if self.stream_ingest:
            cam_count = len(self.stream_ingest.list_cameras())
            online_count = sum(1 for c in self.stream_ingest.list_cameras() if c.status.value == "online")
            components.append(ComponentHealth(
                name="stream_ingest",
                status=ServiceStatus.HEALTHY if online_count > 0 else ServiceStatus.DEGRADED,
                message=f"{online_count}/{cam_count} cameras online",
            ))

        if self.detection_worker:
            components.append(ComponentHealth(
                name="detection_worker",
                status=ServiceStatus.HEALTHY if self.detection_worker.model else ServiceStatus.UNHEALTHY,
                message=f"FPS: {self.detection_worker.fps_counter.fps():.1f}",
            ))

        if self.tracking_service:
            components.append(ComponentHealth(
                name="tracking_service",
                status=ServiceStatus.HEALTHY,
                message=f"Tracking {len(self.tracking_service.trackers)} cameras",
            ))

        if self.alert_engine:
            components.append(ComponentHealth(
                name="alert_engine",
                status=ServiceStatus.HEALTHY,
                message=f"{len(self.alert_engine.alert_history)} alerts in history",
            ))

        if self.anpr_worker:
            components.append(ComponentHealth(
                name="anpr_worker",
                status=ServiceStatus.HEALTHY if self.anpr_worker.ocr_reader else ServiceStatus.DEGRADED,
                message="OCR ready" if self.anpr_worker.ocr_reader else "No OCR engine",
            ))

        if self.face_worker:
            components.append(ComponentHealth(
                name="face_worker",
                status=ServiceStatus.HEALTHY if self.face_worker.face_app else ServiceStatus.DEGRADED,
                message=f"Watchlist: {len(self.face_worker.watchlist)} faces" if self.face_worker.face_app else "InsightFace not loaded",
            ))

        if self.behavior_worker:
            components.append(ComponentHealth(
                name="behavior_worker",
                status=ServiceStatus.HEALTHY if self.behavior_worker.pose_model else ServiceStatus.DEGRADED,
                message="Pose model loaded" if self.behavior_worker.pose_model else "Pose model not loaded",
            ))

        if self.night_worker:
            components.append(ComponentHealth(
                name="night_worker",
                status=ServiceStatus.HEALTHY,
                message="Night enhancement active",
            ))

        if self.recording_service:
            storage_info = self.recording_service.get_storage_info()
            components.append(ComponentHealth(
                name="recording_service",
                status=ServiceStatus.HEALTHY,
                message=f"{storage_info['clip_count']} clips, {storage_info['total_size_mb']} MB",
            ))

        if self.ptz_service:
            ptz_count = len([c for c in self.ptz_service.cameras.keys()])
            components.append(ComponentHealth(
                name="ptz_service",
                status=ServiceStatus.HEALTHY if ptz_count > 0 else ServiceStatus.DEGRADED,
                message=f"{ptz_count} cameras with PTZ",
            ))

        overall = ServiceStatus.HEALTHY
        if any(c.status == ServiceStatus.UNHEALTHY for c in components):
            overall = ServiceStatus.UNHEALTHY
        elif any(c.status == ServiceStatus.DEGRADED for c in components):
            overall = ServiceStatus.DEGRADED

        return HealthCheck(
            service="ibvap",
            version="1.0.0",
            status=overall,
            uptime_seconds=0,
            components=components,
            timestamp=datetime.utcnow(),
        )


app_instance = IBVAPApplication()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await app_instance.startup()
    yield
    await app_instance.shutdown()


app = FastAPI(
    title="IBVAP - Intelligent Border Video Analytics Platform",
    description="AI-powered video analytics for border surveillance",
    version="1.0.0",
    lifespan=lifespan,
)

# Explicit trusted origins for secure credentialed cross-origin requests
trusted_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=trusted_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthCheck)
async def health_check():
    return app_instance.health


@app.post("/cameras", response_model=dict)
async def create_camera(camera: CameraCreate):
    if not app_instance.stream_ingest:
        raise HTTPException(503, "Stream ingest service not running")
    try:
        cam = app_instance.stream_ingest.add_camera(camera)
        return {"id": cam.id, "message": "Camera created"}
    except Exception as e:
        logger.error(f"Failed to create camera: {e}")
        raise HTTPException(500, f"Failed to create camera: {str(e)}")


@app.get("/cameras")
async def list_cameras():
    return app_instance.stream_ingest.list_cameras()


@app.get("/cameras/{camera_id}")
async def get_camera(camera_id: str):
    cam = app_instance.stream_ingest.get_camera(camera_id)
    if not cam:
        raise HTTPException(404, "Camera not found")
    return cam


@app.patch("/cameras/{camera_id}")
async def update_camera(camera_id: str, updates: CameraUpdate):
    success = await app_instance.stream_ingest.update_camera(camera_id, updates.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(404, "Camera not found")
    return {"message": "Camera updated"}


@app.delete("/cameras/{camera_id}")
async def delete_camera(camera_id: str):
    success = await app_instance.stream_ingest.remove_camera(camera_id)
    if not success:
        raise HTTPException(404, "Camera not found")
    return {"message": "Camera deleted"}


@app.get("/cameras/{camera_id}/health")
async def camera_health(camera_id: str):
    health = app_instance.stream_ingest.get_health(camera_id)
    if not health:
        raise HTTPException(404, "Camera not found")
    return health


@app.post("/alerts/rules")
async def create_alert_rule(rule: AlertRule):
    app_instance.alert_engine.add_rule(rule)
    return {"id": rule.id, "message": "Alert rule created"}


@app.get("/alerts/rules")
async def list_alert_rules():
    return app_instance.alert_engine.get_rules()


@app.delete("/alerts/rules/{rule_id}")
async def delete_alert_rule(rule_id: str):
    app_instance.alert_engine.remove_rule(rule_id)
    return {"message": "Alert rule deleted"}


@app.get("/alerts")
async def get_alerts(limit: int = 100, camera_id: str = None):
    return app_instance.alert_engine.get_alerts(limit=limit, camera_id=camera_id)


@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, user: str = "operator"):
    alerts = app_instance.alert_engine.get_alerts()
    for alert in alerts:
        if alert.id == alert_id:
            alert.acknowledged = True
            alert.acknowledged_by = user
            alert.acknowledged_at = datetime.utcnow()
            return {"message": "Alert acknowledged"}
    raise HTTPException(404, "Alert not found")


@app.post("/analytics/face/watchlist")
async def add_face_watchlist(name: str, image_path: str):
    if not app_instance.face_worker:
        raise HTTPException(503, "Face worker not running")
    success = app_instance.face_worker.add_to_watchlist(name, image_path)
    if not success:
        raise HTTPException(400, "Failed to add face to watchlist")
    return {"message": f"Added {name} to watchlist"}


@app.delete("/analytics/face/watchlist/{name}")
async def remove_face_watchlist(name: str):
    if not app_instance.face_worker:
        raise HTTPException(503, "Face worker not running")
    success = app_instance.face_worker.remove_from_watchlist(name)
    if not success:
        raise HTTPException(404, "Face not in watchlist")
    return {"message": f"Removed {name} from watchlist"}


@app.get("/analytics/face/watchlist")
async def list_face_watchlist():
    if not app_instance.face_worker:
        raise HTTPException(503, "Face worker not running")
    return {"watchlist": list(app_instance.face_worker.watchlist.keys())}


# Recording endpoints
@app.get("/recordings/storage")
async def get_storage_info():
    if not app_instance.recording_service:
        raise HTTPException(503, "Recording service not running")
    return app_instance.recording_service.get_storage_info()


@app.get("/recordings/cameras/{camera_id}/clips")
async def list_event_clips(camera_id: str, event_type: str = None):
    if not app_instance.recording_service:
        raise HTTPException(503, "Recording service not running")
    storage_path = app_instance.recording_service.storage_path / camera_id / "events"
    if not storage_path.exists():
        return {"clips": []}

    clips = []
    if event_type:
        type_dir = storage_path / event_type
        if type_dir.exists():
            for clip in type_dir.glob("*.mp4"):
                stat = clip.stat()
                clips.append({
                    "name": clip.name,
                    "path": str(clip),
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
    else:
        for type_dir in storage_path.iterdir():
            if type_dir.is_dir():
                for clip in type_dir.glob("*.mp4"):
                    stat = clip.stat()
                    clips.append({
                        "name": clip.name,
                        "path": str(clip),
                        "event_type": type_dir.name,
                        "size_mb": round(stat.st_size / (1024 * 1024), 2),
                        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    })
    return {"clips": clips}


@app.post("/recordings/cameras/{camera_id}/evidence")
async def export_evidence(camera_id: str, start_time: str, end_time: str):
    if not app_instance.recording_service:
        raise HTTPException(503, "Recording service not running")
    try:
        start = datetime.fromisoformat(start_time)
        end = datetime.fromisoformat(end_time)
    except ValueError:
        raise HTTPException(400, "Invalid datetime format. Use ISO format.")
    path = await app_instance.recording_service.export_evidence(camera_id, start, end)
    if not path:
        raise HTTPException(404, "No frames available for the requested time range")
    return {"path": path, "message": "Evidence exported"}


# PTZ endpoints
@app.post("/ptz/cameras/{camera_id}/initialize")
async def initialize_ptz(camera_id: str):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    cam = app_instance.stream_ingest.get_camera(camera_id)
    if not cam:
        raise HTTPException(404, "Camera not found")
    success = await app_instance.ptz_service.initialize_camera(cam)
    if not success:
        raise HTTPException(400, "Failed to initialize PTZ (ONVIF not available or auth failed)")
    return {"message": f"PTZ initialized for {camera_id}"}


@app.post("/ptz/cameras/{camera_id}/move/absolute")
async def ptz_move_absolute(camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.move_absolute(camera_id, pan, tilt, zoom, speed)
    if not success:
        raise HTTPException(500, "PTZ move failed")
    return {"message": "PTZ moved"}


@app.post("/ptz/cameras/{camera_id}/move/relative")
async def ptz_move_relative(camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.move_relative(camera_id, pan, tilt, zoom, speed)
    if not success:
        raise HTTPException(500, "PTZ move failed")
    return {"message": "PTZ moved"}


@app.post("/ptz/cameras/{camera_id}/move/continuous")
async def ptz_move_continuous(camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.move_continuous(camera_id, pan, tilt, zoom, speed)
    if not success:
        raise HTTPException(500, "PTZ move failed")
    return {"message": "PTZ continuous move started"}


@app.post("/ptz/cameras/{camera_id}/stop")
async def ptz_stop(camera_id: str):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.stop(camera_id)
    if not success:
        raise HTTPException(500, "PTZ stop failed")
    return {"message": "PTZ stopped"}


@app.post("/ptz/cameras/{camera_id}/preset")
async def ptz_goto_preset(camera_id: str, preset_name: str):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.goto_preset(camera_id, preset_name)
    if not success:
        raise HTTPException(404, f"Preset {preset_name} not found")
    return {"message": f"Moved to preset {preset_name}"}


@app.post("/ptz/cameras/{camera_id}/presets")
async def ptz_set_preset(camera_id: str, preset: PTZPreset):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    success = await app_instance.ptz_service.set_preset(camera_id, preset)
    if not success:
        raise HTTPException(500, "Failed to set preset")
    return {"message": f"Preset {preset.name} saved"}


@app.get("/ptz/cameras/{camera_id}/presets")
async def ptz_get_presets(camera_id: str):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    if not app_instance.ptz_service.is_available(camera_id):
        raise HTTPException(400, "PTZ not initialized for this camera")
    presets = await app_instance.ptz_service.get_presets(camera_id)
    return {"presets": [p.model_dump() for p in presets]}


@app.get("/ptz/cameras/{camera_id}/status")
async def ptz_status(camera_id: str):
    if not app_instance.ptz_service:
        raise HTTPException(503, "PTZ service not running")
    status = app_instance.ptz_service.get_status(camera_id)
    if not status:
        raise HTTPException(404, "PTZ not initialized for this camera")
    return status.model_dump()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        reload=True,
    )