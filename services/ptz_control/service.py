import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

try:
    from onvif import ONVIFCamera
    ONVIF_AVAILABLE = True
except ImportError:
    ONVIF_AVAILABLE = False
    ONVIFCamera = None

from shared.schemas.camera import PTZPreset, Camera

logger = logging.getLogger(__name__)


@dataclass
class PTZStatus:
    pan: float = 0.0
    tilt: float = 0.0
    zoom: float = 0.0
    moving: bool = False
    error: Optional[str] = None


class PTZControlService:
    def __init__(self):
        self.cameras: Dict[str, Dict] = {}
        self._running = False

    async def initialize_camera(self, camera: Camera) -> bool:
        if not ONVIF_AVAILABLE:
            logger.warning("ONVIF library not available, PTZ disabled")
            return False

        if not camera.ptz_enabled:
            return False

        try:
            from urllib.parse import urlparse
            parsed = urlparse(camera.stream_url)
            host = parsed.hostname
            port = parsed.port or 80

            cam = ONVIFCamera(host, port, camera.username or "", camera.password or "")
            media = cam.create_media_service()
            ptz = cam.create_ptz_service()

            profiles = media.GetProfiles()
            if not profiles:
                logger.warning(f"No ONVIF profiles found for {camera.id}")
                return False

            profile = profiles[0]
            token = profile.token

            self.cameras[camera.id] = {
                "camera": cam,
                "media": media,
                "ptz": ptz,
                "profile_token": token,
                "status": PTZStatus(),
                "presets": {p.name: p for p in camera.ptz_presets},
            }

            await self._get_status(camera.id)
            logger.info(f"PTZ initialized for camera {camera.id}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize PTZ for {camera.id}: {e}")
            return False

    async def _get_status(self, camera_id: str) -> Optional[PTZStatus]:
        if camera_id not in self.cameras:
            return None

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]
            status = ptz.GetStatus({"ProfileToken": token})

            self.cameras[camera_id]["status"] = PTZStatus(
                pan=status.Position.PanTilt.x if status.Position.PanTilt else 0.0,
                tilt=status.Position.PanTilt.y if status.Position.PanTilt else 0.0,
                zoom=status.Position.Zoom.x if status.Position.Zoom else 0.0,
                moving=status.MoveStatus in ["Moving", "moving"],
            )
            return self.cameras[camera_id]["status"]
        except Exception as e:
            logger.error(f"Failed to get PTZ status for {camera_id}: {e}")
            self.cameras[camera_id]["status"].error = str(e)
            return self.cameras[camera_id]["status"]

    async def move_absolute(self, camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5) -> bool:
        if camera_id not in self.cameras:
            return False

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]

            ptz.AbsoluteMove({
                "ProfileToken": token,
                "Position": {
                    "PanTilt": {"x": pan, "y": tilt},
                    "Zoom": {"x": zoom}
                },
                "Speed": {
                    "PanTilt": {"x": speed, "y": speed},
                    "Zoom": {"x": speed}
                }
            })

            self.cameras[camera_id]["status"].moving = True
            await self._get_status(camera_id)
            return True
        except Exception as e:
            logger.error(f"PTZ absolute move failed for {camera_id}: {e}")
            return False

    async def move_relative(self, camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5) -> bool:
        if camera_id not in self.cameras:
            return False

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]

            ptz.RelativeMove({
                "ProfileToken": token,
                "Translation": {
                    "PanTilt": {"x": pan, "y": tilt},
                    "Zoom": {"x": zoom}
                },
                "Speed": {
                    "PanTilt": {"x": speed, "y": speed},
                    "Zoom": {"x": speed}
                }
            })

            self.cameras[camera_id]["status"].moving = True
            await self._get_status(camera_id)
            return True
        except Exception as e:
            logger.error(f"PTZ relative move failed for {camera_id}: {e}")
            return False

    async def move_continuous(self, camera_id: str, pan: float, tilt: float, zoom: float, speed: float = 0.5) -> bool:
        if camera_id not in self.cameras:
            return False

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]

            ptz.ContinuousMove({
                "ProfileToken": token,
                "Velocity": {
                    "PanTilt": {"x": pan, "y": tilt},
                    "Zoom": {"x": zoom}
                }
            })

            self.cameras[camera_id]["status"].moving = True
            return True
        except Exception as e:
            logger.error(f"PTZ continuous move failed for {camera_id}: {e}")
            return False

    async def stop(self, camera_id: str) -> bool:
        if camera_id not in self.cameras:
            return False

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]

            ptz.Stop({"ProfileToken": token, "PanTilt": True, "Zoom": True})
            self.cameras[camera_id]["status"].moving = False
            await self._get_status(camera_id)
            return True
        except Exception as e:
            logger.error(f"PTZ stop failed for {camera_id}: {e}")
            return False

    async def goto_preset(self, camera_id: str, preset_name: str) -> bool:
        if camera_id not in self.cameras:
            return False

        preset = self.cameras[camera_id]["presets"].get(preset_name)
        if not preset:
            logger.warning(f"Preset {preset_name} not found for {camera_id}")
            return False

        return await self.move_absolute(
            camera_id, preset.pan, preset.tilt, preset.zoom
        )

    async def set_preset(self, camera_id: str, preset: PTZPreset) -> bool:
        if camera_id not in self.cameras:
            return False

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]

            await self.move_absolute(camera_id, preset.pan, preset.tilt, preset.zoom)

            ptz.SetPreset({
                "ProfileToken": token,
                "PresetName": preset.name
            })

            self.cameras[camera_id]["presets"][preset.name] = preset
            logger.info(f"Set preset {preset.name} for {camera_id}")
            return True
        except Exception as e:
            logger.error(f"Set preset failed for {camera_id}: {e}")
            return False

    async def get_presets(self, camera_id: str) -> List[PTZPreset]:
        if camera_id not in self.cameras:
            return []

        try:
            ptz = self.cameras[camera_id]["ptz"]
            token = self.cameras[camera_id]["profile_token"]
            presets = ptz.GetPresets({"ProfileToken": token})

            result = []
            for p in presets:
                result.append(PTZPreset(name=p.Name, pan=0.0, tilt=0.0, zoom=0.0))
            return result
        except Exception as e:
            logger.error(f"Get presets failed for {camera_id}: {e}")
            return list(self.cameras[camera_id]["presets"].values())

    async def remove_camera(self, camera_id: str):
        if camera_id in self.cameras:
            del self.cameras[camera_id]

    def get_status(self, camera_id: str) -> Optional[PTZStatus]:
        if camera_id in self.cameras:
            return self.cameras[camera_id]["status"]
        return None

    def is_available(self, camera_id: str) -> bool:
        return camera_id in self.cameras and ONVIF_AVAILABLE