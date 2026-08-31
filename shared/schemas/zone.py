from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal
from enum import Enum
import numpy as np


class ZoneType(str, Enum):
    POLYGON = "polygon"
    RECTANGLE = "rectangle"
    LINE = "line"
    CIRCLE = "circle"


class ZoneConfig(BaseModel):
    type: ZoneType
    coordinates: List[List[float]] = Field(..., description="Polygon points [[x1,y1], [x2,y2], ...] or rectangle [x1,y1,x2,y2] or line [[x1,y1],[x2,y2]] or circle [cx,cy,r]")
    name: str
    camera_id: str
    enabled: bool = True
    classes: List[str] = Field(default_factory=list, description="Empty = all classes")
    direction: Optional[str] = Field(None, description="For line zones: 'both', 'AtoB', 'BtoA'")
    dwell_time: float = Field(0, description="Minimum seconds inside zone to trigger")
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v, info):
        zone_type = info.data.get("type")
        if zone_type == ZoneType.POLYGON:
            if len(v) < 3:
                raise ValueError("Polygon needs at least 3 points")
            for pt in v:
                if len(pt) != 2:
                    raise ValueError("Polygon points must be [x, y]")
        elif zone_type == ZoneType.RECTANGLE:
            if len(v) != 1 or len(v[0]) != 4:
                raise ValueError("Rectangle must be [[x1, y1, x2, y2]]")
        elif zone_type == ZoneType.LINE:
            if len(v) != 2 or len(v[0]) != 2 or len(v[1]) != 2:
                raise ValueError("Line must be [[x1, y1], [x2, y2]]")
        elif zone_type == ZoneType.CIRCLE:
            if len(v) != 1 or len(v[0]) != 3:
                raise ValueError("Circle must be [[cx, cy, r]]")
        return v


class Zone(BaseModel):
    id: str
    config: ZoneConfig
    created_at: float
    updated_at: float

    def contains_point(self, x: float, y: float) -> bool:
        cfg = self.config
        if cfg.type == ZoneType.POLYGON:
            return self._point_in_polygon(x, y, cfg.coordinates)
        elif cfg.type == ZoneType.RECTANGLE:
            x1, y1, x2, y2 = cfg.coordinates[0]
            return x1 <= x <= x2 and y1 <= y <= y2
        elif cfg.type == ZoneType.CIRCLE:
            cx, cy, r = cfg.coordinates[0]
            return (x - cx) ** 2 + (y - cy) ** 2 < r ** 2
        return False

    def line_crossed(self, prev_x: float, prev_y: float, curr_x: float, curr_y: float) -> Optional[str]:
        if self.config.type != ZoneType.LINE:
            return None
        x1, y1 = self.config.coordinates[0]
        x2, y2 = self.config.coordinates[1]
        return self._check_line_cross(x1, y1, x2, y2, prev_x, prev_y, curr_x, curr_y, self.config.direction)

    def _point_in_polygon(self, x: float, y: float, polygon: List[List[float]]) -> bool:
        inside = False
        n = len(polygon)
        for i in range(n):
            j = (i + 1) % n
            xi, yi = polygon[i]
            xj, yj = polygon[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
        return inside

    def _check_line_cross(self, x1, y1, x2, y2, px1, py1, px2, py2, direction) -> Optional[str]:
        def ccw(ax, ay, bx, by, cx, cy):
            return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)

        crossed = ccw(px1, py1, x1, y1, x2, y2) != ccw(px2, py2, x1, y1, x2, y2) and \
                  ccw(px1, py1, px2, py2, x1, y1) != ccw(px1, py1, px2, py2, x2, y2)

        if not crossed:
            return None

        line_dx = x2 - x1
        line_dy = y2 - y1
        cross_dx = px2 - px1
        cross_dy = py2 - py1

        cross_product = line_dx * cross_dy - line_dy * cross_dx

        if direction == "AtoB":
            if cross_product > 0:
                return "AtoB"
            return None
        elif direction == "BtoA":
            if cross_product < 0:
                return "BtoA"
            return None

        return "both"