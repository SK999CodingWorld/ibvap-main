import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from shared.schemas.zone import Zone, ZoneConfig, ZoneType


def load_zones_from_file(filepath: str) -> List[Zone]:
    with open(filepath, "r") as f:
        data = json.load(f)
    zones = []
    for item in data:
        config = ZoneConfig(**item["config"]) if "config" in item else ZoneConfig(**item)
        zone = Zone(
            id=item.get("id", config.name.lower().replace(" ", "_")),
            config=config,
            created_at=item.get("created_at", 0),
            updated_at=item.get("updated_at", 0),
        )
        zones.append(zone)
    return zones


def save_zones_to_file(zones: List[Zone], filepath: str):
    data = []
    for zone in zones:
        data.append({
            "id": zone.id,
            "config": zone.config.model_dump(),
            "created_at": zone.created_at,
            "updated_at": zone.updated_at,
        })
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def create_default_zones(camera_id: str, frame_width: int = 1280, frame_height: int = 720) -> List[Zone]:
    import time
    now = time.time()
    zones = [
        Zone(
            id=f"{camera_id}_restricted",
            config=ZoneConfig(
                type=ZoneType.POLYGON,
                coordinates=[
                    [frame_width * 0.3, frame_height * 0.2],
                    [frame_width * 0.7, frame_height * 0.2],
                    [frame_width * 0.7, frame_height * 0.8],
                    [frame_width * 0.3, frame_height * 0.8],
                ],
                name="Restricted Zone",
                camera_id=camera_id,
                enabled=True,
                classes=["person", "car", "truck", "bus", "motorcycle"],
                dwell_time=2.0,
            ),
            created_at=now,
            updated_at=now,
        ),
        Zone(
            id=f"{camera_id}_perimeter",
            config=ZoneConfig(
                type=ZoneType.LINE,
                coordinates=[
                    [frame_width * 0.1, frame_height * 0.5],
                    [frame_width * 0.9, frame_height * 0.5],
                ],
                name="Perimeter Line",
                camera_id=camera_id,
                enabled=True,
                classes=["person", "car", "truck"],
                direction="both",
            ),
            created_at=now,
            updated_at=now,
        ),
    ]
    return zones


def zones_to_geojson(zones: List[Zone]) -> Dict[str, Any]:
    features = []
    for zone in zones:
        cfg = zone.config
        if cfg.type == ZoneType.POLYGON:
            geom = {"type": "Polygon", "coordinates": [cfg.coordinates + [cfg.coordinates[0]]]}
        elif cfg.type == ZoneType.RECTANGLE:
            x1, y1, x2, y2 = cfg.coordinates[0]
            geom = {"type": "Polygon", "coordinates": [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]]}
        elif cfg.type == ZoneType.LINE:
            geom = {"type": "LineString", "coordinates": cfg.coordinates}
        elif cfg.type == ZoneType.CIRCLE:
            cx, cy, r = cfg.coordinates[0]
            geom = {"type": "Point", "coordinates": [cx, cy], "properties": {"radius": r}}
        else:
            continue

        features.append({
            "type": "Feature",
            "id": zone.id,
            "geometry": geom,
            "properties": {
                "name": cfg.name,
                "camera_id": cfg.camera_id,
                "enabled": cfg.enabled,
                "classes": cfg.classes,
                "dwell_time": cfg.dwell_time,
                "zone_type": cfg.type.value,
            },
        })

    return {"type": "FeatureCollection", "features": features}