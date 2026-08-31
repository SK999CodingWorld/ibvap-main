from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DetectionClass(str, Enum):
    PERSON = "person"
    BICYCLE = "bicycle"
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    AIRPLANE = "airplane"
    BUS = "bus"
    TRAIN = "train"
    TRUCK = "truck"
    BOAT = "boat"
    TRAFFIC_LIGHT = "traffic light"
    FIRE_HYDRANT = "fire hydrant"
    STOP_SIGN = "stop sign"
    PARKING_METER = "parking meter"
    BENCH = "bench"
    BIRD = "bird"
    CAT = "cat"
    DOG = "dog"
    HORSE = "horse"
    SHEEP = "sheep"
    COW = "cow"
    ELEPHANT = "elephant"
    BEAR = "bear"
    ZEBRA = "zebra"
    GIRAFFE = "giraffe"
    BACKPACK = "backpack"
    UMBRELLA = "umbrella"
    HANDBAG = "handbag"
    TIE = "tie"
    SUITCASE = "suitcase"
    FRISBEE = "frisbee"
    SKIS = "skis"
    SNOWBOARD = "snowboard"
    SPORTS_BALL = "sports ball"
    KITE = "kite"
    BASEBALL_BAT = "baseball bat"
    BASEBALL_GLOVE = "baseball glove"
    SKATEBOARD = "skateboard"
    SURFBOARD = "surfboard"
    TENNIS_RACKET = "tennis racket"
    BOTTLE = "bottle"
    WINE_GLASS = "wine glass"
    CUP = "cup"
    FORK = "fork"
    KNIFE = "knife"
    SPOON = "spoon"
    BOWL = "bowl"
    BANANA = "banana"
    APPLE = "apple"
    SANDWICH = "sandwich"
    ORANGE = "orange"
    BROCCOLI = "broccoli"
    CARROT = "carrot"
    HOT_DOG = "hot dog"
    PIZZA = "pizza"
    DONUT = "donut"
    CAKE = "cake"
    CHAIR = "chair"
    COUCH = "couch"
    POTTED_PLANT = "potted plant"
    BED = "bed"
    DINING_TABLE = "dining table"
    TOILET = "toilet"
    TV = "tv"
    LAPTOP = "laptop"
    MOUSE = "mouse"
    REMOTE = "remote"
    KEYBOARD = "keyboard"
    CELL_PHONE = "cell phone"
    MICROWAVE = "microwave"
    OVEN = "oven"
    TOASTER = "toaster"
    SINK = "sink"
    REFRIGERATOR = "refrigerator"
    BOOK = "book"
    CLOCK = "clock"
    VASE = "vase"
    SCISSORS = "scissors"
    TEDDY_BEAR = "teddy bear"
    HAIR_DRIER = "hair drier"
    TOOTHBRUSH = "toothbrush"


class BoundingBox(BaseModel):
    x1: float = Field(..., ge=0)
    y1: float = Field(..., ge=0)
    x2: float = Field(..., ge=0)
    y2: float = Field(..., ge=0)

    @property
    def width(self) -> float:
        return self.x2 - self.x1

    @property
    def height(self) -> float:
        return self.y2 - self.y1

    @property
    def center(self) -> tuple:
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)

    def to_xywh(self) -> tuple:
        return (self.x1, self.y1, self.width, self.height)

    def to_xyxy(self) -> tuple:
        return (self.x1, self.y1, self.x2, self.y2)

    def area(self) -> float:
        return self.width * self.height

    def iou(self, other: "BoundingBox") -> float:
        x1 = max(self.x1, other.x1)
        y1 = max(self.y1, other.y1)
        x2 = min(self.x2, other.x2)
        y2 = min(self.y2, other.y2)

        if x2 < x1 or y2 < y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        union = self.area() + other.area() - intersection
        return intersection / union if union > 0 else 0.0


class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: BoundingBox
    track_id: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @property
    def center(self) -> tuple:
        return self.bbox.center


class DetectionBatch(BaseModel):
    camera_id: str
    frame_id: int
    timestamp: datetime
    detections: List[Detection]
    inference_time_ms: float
    image_shape: tuple = (0, 0)  # (height, width)