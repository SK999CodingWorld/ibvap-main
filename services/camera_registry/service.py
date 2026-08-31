import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.camera import Camera, CameraCreate, CameraUpdate, CameraStatus, CameraHealth

logger = logging.getLogger(__name__)


class CameraRegistryService:
    def __init__(self, stream_manager: StreamManager, storage_path: str = "./cameras.json"):
        self.stream_manager = stream_manager
        self.storage_path = Path(storage_path)
        self.cameras: Dict[str, Camera] = {}
        self._load()

    def _load(self):
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r") as f:
                    data = json.load(f)
                for item in data:
                    cam = Camera(**item)
                    self.cameras[cam.id] = cam
                logger.info(f"Loaded {len(self.cameras)} cameras from storage")
            except Exception as e:
                logger.error(f"Failed to load cameras: {e}")

    def _save(self):
        try:
            data = [cam.model_dump() for cam in self.cameras.values()]
            with open(self.storage_path, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save cameras: {e}")

    def create_camera(self, camera: CameraCreate) -> Camera:
        cam = Camera(
            id=str(uuid.uuid4())[:8],
            **camera.model_dump(),
            status=CameraStatus.OFFLINE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.cameras[cam.id] = cam
        self._save()
        logger.info(f"Created camera: {cam.id} ({cam.name})")
        return cam

    def get_camera(self, camera_id: str) -> Optional[Camera]:
        return self.cameras.get(camera_id)

    def list_cameras(self) -> List[Camera]:
        return list(self.cameras.values())

    def update_camera(self, camera_id: str, updates: CameraUpdate) -> Optional[Camera]:
        if camera_id not in self.cameras:
            return None

        cam = self.cameras[camera_id]
        update_data = updates.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(cam, key, value)

        cam.updated_at = datetime.utcnow()
        self._save()
        logger.info(f"Updated camera: {camera_id}")
        return cam

    def delete_camera(self, camera_id: str) -> bool:
        if camera_id not in self.cameras:
            return False

        del self.cameras[camera_id]
        self._save()
        logger.info(f"Deleted camera: {camera_id}")
        return True

    def get_health(self, camera_id: str) -> Optional[CameraHealth]:
        cam = self.cameras.get(camera_id)
        if not cam:
            return None

        return CameraHealth(
            camera_id=camera_id,
            status=cam.status,
            last_frame_time=cam.last_seen,
            fps=cam.fps,
            latency_ms=0.0,
            error_count=0,
            last_error=cam.error_message,
        )

    async def set_camera_status(self, camera_id: str, status: CameraStatus, error: Optional[str] = None):
        if camera_id in self.cameras:
            self.cameras[camera_id].status = status
            if error:
                self.cameras[camera_id].error_message = error
            self.cameras[camera_id].last_seen = datetime.utcnow()
            self._save()