from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from .detection import BoundingBox, Detection


class TrackState(str, Enum):
    NEW = "new"
    TRACKED = "tracked"
    LOST = "lost"
    REMOVED = "removed"


class Track(BaseModel):
    track_id: int
    camera_id: str
    class_id: int
    class_name: str
    bbox: BoundingBox
    confidence: float
    state: TrackState = TrackState.NEW
    age: int = 0
    hits: int = 1
    hit_streak: int = 1
    time_since_update: int = 0
    start_time: datetime
    last_update: datetime
    zone_events: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @property
    def center(self) -> tuple:
        return self.bbox.center

    @property
    def is_confirmed(self) -> bool:
        return self.hits >= 3 and self.hit_streak >= 2

    @property
    def is_lost(self) -> bool:
        return self.time_since_update > 30


class TrackBatch(BaseModel):
    camera_id: str
    frame_id: int
    timestamp: datetime
    tracks: List[Track]
    removed_tracks: List[int] = Field(default_factory=list)