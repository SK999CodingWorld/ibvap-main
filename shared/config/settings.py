from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List
import json


class Settings(BaseSettings):
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None

    # Stream Ingest
    stream_buffer_size: int = 30
    stream_reconnect_delay: float = 5.0
    stream_hw_decode: bool = True

    # Detection
    detection_model: str = "yolov8n.pt"
    detection_device: str = "auto"
    detection_conf: float = 0.35
    detection_iou: float = 0.45
    detection_classes: List[int] = [0, 1, 2, 3, 5, 7]  # person, bicycle, car, motorcycle, bus, truck
    detection_imgsz: int = 640
    detection_half: bool = False

    # Tracking
    tracker_type: str = "botsort"  # botsort, bytetrack
    tracker_config: str = "botsort.yaml"
    track_buffer: int = 30
    match_thresh: float = 0.8

    # Zones
    zones_config: str = "zones.json"

    # Alerts
    alert_cooldown: float = 5.0
    alert_max_history: int = 1000

    # Recording
    record_enabled: bool = False
    record_segment_duration: int = 300
    record_retention_days: int = 30
    record_path: str = "./recordings"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 1
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()