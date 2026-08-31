import pytest
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient

import main as main_module
from main import app as main_app, app_instance, IBVAPApplication
import simple_dashboard as simple_dashboard_module
from simple_dashboard import app as simple_app


# ==============================================================================
# Tests for simple_dashboard.py endpoints (Real data & Error handling)
# ==============================================================================

class TestSimpleDashboardEndpoints:
    @classmethod
    def setup_class(cls):
        cls.client = TestClient(simple_app)

    def test_api_health(self):
        response = self.client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "ibvap"
        assert "status" in data
        assert "uptime_seconds" in data
        assert isinstance(data["components"], list)
        assert len(data["components"]) >= 3
        component_names = [c["name"] for c in data["components"]]
        assert "detection_worker" in component_names
        assert "stream_ingest" in component_names
        assert "alert_engine" in component_names

    def test_api_cameras(self):
        response = self.client.get("/api/cameras")
        assert response.status_code == 200
        cameras = response.json()
        assert isinstance(cameras, list)
        assert len(cameras) >= 1
        cam = cameras[0]
        assert "id" in cam
        assert "name" in cam
        assert "status" in cam
        assert "protocol" in cam

    def test_api_alerts(self):
        response = self.client.get("/api/alerts")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)

    def test_api_recordings_storage(self):
        response = self.client.get("/api/recordings/storage")
        assert response.status_code == 200
        storage = response.json()
        assert "total_size_bytes" in storage
        assert "total_size_mb" in storage
        assert "clip_count" in storage
        assert "cameras" in storage
        assert isinstance(storage["cameras"], list)

    def test_api_status_aggregate(self):
        response = self.client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "health" in data
        assert "cameras" in data
        assert "alerts" in data
        assert "storage" in data
        assert "timestamp" in data

    def test_simple_page(self):
        response = self.client.get("/simple")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "IBVAP — Live Dashboard" in response.text

    def test_alerts_endpoint(self):
        response = self.client.get("/alerts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ==============================================================================
# Tests for main.py endpoints (503 Service Checks, Valid/Invalid Input, CRUD)
# ==============================================================================

class TestMainEndpointsWithoutServices:
    @classmethod
    def setup_class(cls):
        app_instance.stream_ingest = None
        app_instance.alert_engine = None
        app_instance.recording_service = None
        app_instance.ptz_service = None
        app_instance.face_worker = None
        app_instance.detection_worker = None
        app_instance.tracking_service = None
        cls.client = TestClient(main_app)

    def test_health_without_services(self):
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "ibvap"

    def test_api_status_without_services(self):
        response = self.client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "health" in data
        assert data["cameras"]["total"] == 0

    def test_cameras_503(self):
        assert self.client.get("/cameras").status_code == 503
        assert self.client.get("/cameras/cam1").status_code == 503
        assert self.client.get("/cameras/cam1/health").status_code == 503
        assert self.client.post("/cameras", json={"name": "test", "protocol": "rtsp", "stream_url": "rtsp://test"}).status_code == 503
        assert self.client.patch("/cameras/cam1", json={"name": "test2"}).status_code == 503
        assert self.client.delete("/cameras/cam1").status_code == 503

    def test_alerts_503(self):
        assert self.client.get("/alerts").status_code == 503
        assert self.client.get("/alerts/rules").status_code == 503
        assert self.client.post("/alerts/rules", json={"id": "r1", "name": "rule", "camera_ids": [], "alert_types": [], "cooldown_seconds": 5}).status_code == 503
        assert self.client.delete("/alerts/rules/r1").status_code == 503
        assert self.client.post("/alerts/alert1/acknowledge").status_code == 503

    def test_recordings_503(self):
        assert self.client.get("/recordings/storage").status_code == 503
        assert self.client.get("/recordings/cameras/cam1/clips").status_code == 503
        assert self.client.post("/recordings/cameras/cam1/evidence?start_time=2026-01-01T00:00:00&end_time=2026-01-01T01:00:00").status_code == 503

    def test_face_watchlist_503(self):
        assert self.client.get("/analytics/face/watchlist").status_code == 503
        assert self.client.post("/analytics/face/watchlist?name=test&image_path=test.jpg").status_code == 503
        assert self.client.delete("/analytics/face/watchlist/test").status_code == 503

    def test_ptz_503(self):
        assert self.client.get("/ptz/cameras/cam1/status").status_code == 503
        assert self.client.get("/ptz/cameras/cam1/presets").status_code == 503
        assert self.client.post("/ptz/cameras/cam1/initialize").status_code == 503
        assert self.client.post("/ptz/cameras/cam1/stop").status_code == 503


class TestMainEndpointsWithActiveServices:
    @classmethod
    def setup_class(cls):
        mock_ingest = MagicMock()
        mock_camera = MagicMock()
        mock_camera.id = "cam_test"
        mock_camera.name = "Test Camera"
        mock_camera.status.value = "online"
        mock_ingest.list_cameras.return_value = [mock_camera]
        mock_ingest.get_camera.side_effect = lambda cid: mock_camera if cid == "cam_test" else None
        mock_ingest.add_camera.return_value = mock_camera
        mock_ingest.update_camera = AsyncMock(side_effect=lambda cid, up: True if cid == "cam_test" else False)
        mock_ingest.remove_camera = AsyncMock(side_effect=lambda cid: True if cid == "cam_test" else False)
        mock_ingest.get_health.side_effect = lambda cid: {"fps": 30.0, "status": "online"} if cid == "cam_test" else None

        mock_alert_engine = MagicMock()
        mock_alert = MagicMock()
        mock_alert.id = "alert_test"
        mock_alert.acknowledged = False
        mock_alert_engine.get_alerts.return_value = [mock_alert]
        mock_alert_engine.alert_history = [mock_alert]
        mock_alert_engine.get_rules.return_value = []
        mock_alert_engine.add_rule = MagicMock()
        mock_alert_engine.remove_rule = MagicMock()

        mock_rec = MagicMock()
        mock_rec.get_storage_info.return_value = {
            "total_size_bytes": 1024,
            "total_size_mb": 1.0,
            "clip_count": 2,
            "cameras": ["cam_test"],
        }
        mock_rec.storage_path = MagicMock()
        mock_rec.storage_path.exists.return_value = False
        mock_rec.export_evidence = AsyncMock(return_value="/recordings/evidence_123.mp4")

        mock_face = MagicMock()
        mock_face.watchlist = {"Officer_Singh": b"embedding"}
        mock_face.add_to_watchlist.return_value = True
        mock_face.remove_from_watchlist.side_effect = lambda n: True if n in mock_face.watchlist else False

        mock_ptz = MagicMock()
        mock_ptz.is_available.side_effect = lambda cid: True if cid == "cam_test" else False
        mock_ptz.initialize_camera = AsyncMock(return_value=True)
        mock_ptz.move_absolute = AsyncMock(return_value=True)
        mock_ptz.move_relative = AsyncMock(return_value=True)
        mock_ptz.move_continuous = AsyncMock(return_value=True)
        mock_ptz.stop = AsyncMock(return_value=True)
        mock_ptz.goto_preset = AsyncMock(return_value=True)
        mock_ptz.set_preset = AsyncMock(return_value=True)
        mock_ptz_preset = MagicMock()
        mock_ptz_preset.model_dump.return_value = {"name": "Gate", "pan": 0.5, "tilt": 0.2, "zoom": 1.0}
        mock_ptz.get_presets = AsyncMock(return_value=[mock_ptz_preset])
        mock_ptz_status = MagicMock()
        mock_ptz_status.model_dump.return_value = {"pan": 0.5, "tilt": 0.2, "zoom": 1.0, "moving": False}
        mock_ptz.get_status.side_effect = lambda cid: mock_ptz_status if cid == "cam_test" else None

        app_instance.stream_ingest = mock_ingest
        app_instance.alert_engine = mock_alert_engine
        app_instance.recording_service = mock_rec
        app_instance.face_worker = mock_face
        app_instance.ptz_service = mock_ptz

        cls.client = TestClient(main_app)

    def test_camera_crud_operations(self):
        res = self.client.get("/cameras")
        assert res.status_code == 200

        res = self.client.get("/cameras/cam_test")
        assert res.status_code == 200

        res = self.client.get("/cameras/non_existing")
        assert res.status_code == 404

        res = self.client.post("/cameras", json={
            "name": "New Camera",
            "protocol": "rtsp",
            "stream_url": "rtsp://192.168.1.100/live",
            "location": "North Gate"
        })
        assert res.status_code == 200
        assert "id" in res.json()

        res = self.client.patch("/cameras/cam_test", json={"name": "Updated Name"})
        assert res.status_code == 200

        res = self.client.patch("/cameras/non_existing", json={"name": "Updated Name"})
        assert res.status_code == 404

        res = self.client.delete("/cameras/cam_test")
        assert res.status_code == 200

        res = self.client.delete("/cameras/non_existing")
        assert res.status_code == 404

        assert self.client.get("/cameras/cam_test/health").status_code == 200
        assert self.client.get("/cameras/non_existing/health").status_code == 404

    def test_alert_operations(self):
        res = self.client.get("/alerts")
        assert res.status_code == 200
        assert len(res.json()) >= 1

        res = self.client.post("/alerts/alert_test/acknowledge")
        assert res.status_code == 200

        res = self.client.post("/alerts/missing_alert/acknowledge")
        assert res.status_code == 404

        res = self.client.get("/alerts/rules")
        assert res.status_code == 200

        res = self.client.post("/alerts/rules", json={
            "id": "rule_1",
            "name": "Perimeter Intrusion",
            "camera_ids": ["cam_test"],
            "alert_types": ["intrusion"],
            "cooldown_seconds": 10
        })
        assert res.status_code == 200

        res = self.client.delete("/alerts/rules/rule_1")
        assert res.status_code == 200

    def test_recording_operations(self):
        res = self.client.get("/recordings/storage")
        assert res.status_code == 200
        assert res.json()["clip_count"] == 2

        res = self.client.post("/recordings/cameras/cam_test/evidence?start_time=2026-01-01T00:00:00&end_time=2026-01-01T01:00:00")
        assert res.status_code == 200
        assert "path" in res.json()

        res = self.client.post("/recordings/cameras/cam_test/evidence?start_time=invalid-date&end_time=not-a-date")
        assert res.status_code == 400
        assert "Invalid datetime format" in res.json()["detail"]

    def test_face_watchlist_operations(self):
        res = self.client.get("/analytics/face/watchlist")
        assert res.status_code == 200
        assert "Officer_Singh" in res.json()["watchlist"]

        res = self.client.post("/analytics/face/watchlist?name=Inspector_Kumar&image_path=kumar.jpg")
        assert res.status_code == 200

        res = self.client.delete("/analytics/face/watchlist/Officer_Singh")
        assert res.status_code == 200

        res = self.client.delete("/analytics/face/watchlist/Unknown_Person")
        assert res.status_code == 404

    def test_ptz_operations(self):
        res = self.client.post("/ptz/cameras/cam_test/initialize")
        assert res.status_code == 200

        res = self.client.post("/ptz/cameras/non_existing/initialize")
        assert res.status_code == 404

        res = self.client.post("/ptz/cameras/cam_test/move/absolute?pan=0.5&tilt=0.2&zoom=1.0")
        assert res.status_code == 200

        res = self.client.post("/ptz/cameras/uninit_cam/move/absolute?pan=0.5&tilt=0.2&zoom=1.0")
        assert res.status_code == 400

        res = self.client.post("/ptz/cameras/cam_test/stop")
        assert res.status_code == 200

        res = self.client.get("/ptz/cameras/cam_test/status")
        assert res.status_code == 200
        assert "pan" in res.json()

        res = self.client.get("/ptz/cameras/non_existing/status")
        assert res.status_code == 404

    def test_api_status_aggregate_active(self):
        res = self.client.get("/api/status")
        assert res.status_code == 200
        data = res.json()
        assert data["cameras"]["total"] == 1
        assert data["cameras"]["online"] == 1
        assert data["alerts"]["total"] == 1
        assert data["storage"]["clip_count"] == 2
