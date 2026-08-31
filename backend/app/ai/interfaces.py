from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class BoundingBox:
    x: float
    y: float
    width: float
    height: float

@dataclass
class PersonAttributes:
    clothing_upper_color: Optional[str] = None
    clothing_lower_color: Optional[str] = None
    clothing_upper_type: Optional[str] = None
    clothing_lower_type: Optional[str] = None
    has_helmet: bool = False
    has_backpack: bool = False
    has_umbrella: bool = False
    pose_action: str = "standing"  # standing, walking, running, sitting, falling, lying, bending, climbing, jumping
    movement_state: str = "stationary"  # stationary, moving_slow, moving_fast, loitering

@dataclass
class VehicleAttributes:
    vehicle_type: str = "car"  # car, suv, pickup, van, truck, bus, motorcycle, scooter, bicycle, three_wheeler, emergency_vehicle, heavy_vehicle, trailer, unknown_vehicle
    license_plate: Optional[str] = None
    plate_confidence: Optional[float] = None
    plate_status: str = "confirmed"  # confirmed, uncertain, unreadable
    lane: Optional[str] = None
    color: Optional[str] = None

@dataclass
class AnimalAttributes:
    species: str = "dog"  # dog, cattle, horse, wild_animal, bird, unknown_animal
    is_domestic: bool = True
    threat_filter_applied: bool = True
    filter_reason: str = "Not classified as human intrusion - Low Risk"

@dataclass
class TrajectoryPoint:
    x: float
    y: float
    timestamp: str
    speed: float

@dataclass 
class Detection:
    object_type: str  # person, vehicle, animal, object, face, unknown
    confidence: float
    bbox: BoundingBox
    tracking_id: Optional[str] = None
    direction: Optional[str] = None  # N, NE, E, SE, S, SW, W, NW
    speed: Optional[float] = None  # m/s or km/h
    acceleration: Optional[float] = None
    zone: Optional[str] = None
    certainty: str = 'confirmed'  # confirmed/probable/uncertain/unknown/occluded/poor_quality
    dwell_time_seconds: float = 0.0
    distance_travelled_meters: float = 0.0
    trajectories: List[TrajectoryPoint] = field(default_factory=list)
    person_attrs: Optional[PersonAttributes] = None
    vehicle_attrs: Optional[VehicleAttributes] = None
    animal_attrs: Optional[AnimalAttributes] = None
    events: List[str] = field(default_factory=list)
    risk_score: int = 0
    risk_factors: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class CrowdMetrics:
    camera_id: str
    people_count: int = 0
    density_level: str = "LOW"  # LOW, MEDIUM, HIGH, CRITICAL
    density_percentage: float = 0.0
    growth_rate: float = 0.0  # +% per minute
    dominant_direction: str = "NORTH"
    zone: str = "ALL"
    risk_level: str = "LOW"

@dataclass
class ImageQualityAssessment:
    camera_id: str
    overall_score: int = 85  # 0 - 100
    lighting_condition: str = "DAY"  # DAY, NIGHT, DAWN, DUSK, LOW_LIGHT, OVEREXPOSED
    blur_score: float = 0.12  # lower is sharper
    fog_haze_detected: bool = False
    rain_dust_detected: bool = False
    contrast_level: str = "NORMAL"  # NORMAL, LOW, HIGH
    tampering_detected: bool = False
    tampering_type: Optional[str] = None  # camera_moved, camera_obstructed, lens_covered, black_screen, frozen_frame, sudden_scene_change
    recommendation: Optional[str] = None

@dataclass
class ANPRResult:
    plate_number: str
    vehicle_type: str
    confidence: float
    bbox: BoundingBox
    status: str = "CONFIRMED"  # CONFIRMED, UNCERTAIN, LOW_CONFIDENCE
    crop_url: Optional[str] = None
    pipeline_stages: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class FaceResult:
    confidence: float
    bbox: BoundingBox
    quality: str = "HIGH"  # HIGH, MEDIUM, LOW
    occlusion: str = "LOW"  # NONE, LOW, PARTIAL, HEAVY
    authorized_identity: Optional[str] = None  # Only populated if explicitly audited & authorized

class DetectorInterface(ABC):
    @abstractmethod
    async def detect(self, frame, config: Dict) -> List[Detection]: ...
    @abstractmethod  
    def get_model_info(self) -> Dict: ...

class TrackerInterface(ABC):
    @abstractmethod
    async def update(self, detections: List[Detection], frame_id: int) -> List[Detection]: ...
    @abstractmethod
    def get_tracks(self) -> Dict: ...

class OCRInterface(ABC):
    @abstractmethod
    async def read_plate(self, plate_image) -> ANPRResult: ...

class FaceDetectorInterface(ABC):
    @abstractmethod
    async def detect_faces(self, frame) -> List[FaceResult]: ...

class BehaviorAnalyzerInterface(ABC):
    @abstractmethod
    async def analyze(self, tracks: Dict, zones: List, time_context: Dict) -> List[Dict]: ...
