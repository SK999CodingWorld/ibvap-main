import pytest
from shared.schemas.zone import Zone, ZoneConfig, ZoneType


def test_polygon_zone_contains_point():
    zone = Zone(
        id="test",
        config=ZoneConfig(
            type=ZoneType.POLYGON,
            coordinates=[[0, 0], [10, 0], [10, 10], [0, 10]],
            name="Test Zone",
            camera_id="cam1",
        ),
        created_at=0,
        updated_at=0,
    )

    assert zone.contains_point(5, 5) is True
    assert zone.contains_point(15, 5) is False
    assert zone.contains_point(-1, 5) is False
    assert zone.contains_point(1, 1) is True
    assert zone.contains_point(9, 9) is True


def test_rectangle_zone_contains_point():
    zone = Zone(
        id="test",
        config=ZoneConfig(
            type=ZoneType.RECTANGLE,
            coordinates=[[100, 100, 200, 200]],
            name="Test Zone",
            camera_id="cam1",
        ),
        created_at=0,
        updated_at=0,
    )

    assert zone.contains_point(150, 150) is True
    assert zone.contains_point(50, 50) is False
    assert zone.contains_point(100, 100) is True
    assert zone.contains_point(200, 200) is True


def test_circle_zone_contains_point():
    zone = Zone(
        id="test",
        config=ZoneConfig(
            type=ZoneType.CIRCLE,
            coordinates=[[100, 100, 50]],
            name="Test Zone",
            camera_id="cam1",
        ),
        created_at=0,
        updated_at=0,
    )

    assert zone.contains_point(100, 100) is True
    assert zone.contains_point(125, 100) is True
    assert zone.contains_point(149, 100) is True
    assert zone.contains_point(150, 100) is False
    assert zone.contains_point(100, 150) is False


def test_line_zone_crossed():
    zone = Zone(
        id="test",
        config=ZoneConfig(
            type=ZoneType.LINE,
            coordinates=[[0, 50], [100, 50]],
            name="Test Line",
            camera_id="cam1",
            direction="both",
        ),
        created_at=0,
        updated_at=0,
    )

    assert zone.line_crossed(50, 40, 50, 60) == "both"
    assert zone.line_crossed(50, 60, 50, 40) == "both"
    assert zone.line_crossed(50, 40, 50, 45) is None
    assert zone.line_crossed(50, 60, 50, 65) is None


def test_line_zone_direction():
    zone_a_to_b = Zone(
        id="test",
        config=ZoneConfig(
            type=ZoneType.LINE,
            coordinates=[[0, 50], [100, 50]],
            name="Test Line",
            camera_id="cam1",
            direction="AtoB",
        ),
        created_at=0,
        updated_at=0,
    )

    assert zone_a_to_b.line_crossed(50, 40, 50, 60) == "AtoB"
    assert zone_a_to_b.line_crossed(50, 60, 50, 40) is None


def test_zone_validation():
    with pytest.raises(ValueError):
        ZoneConfig(
            type=ZoneType.POLYGON,
            coordinates=[[0, 0], [10, 0]],
            name="Test",
            camera_id="cam1",
        )

    with pytest.raises(ValueError):
        ZoneConfig(
            type=ZoneType.RECTANGLE,
            coordinates=[[0, 0, 10]],
            name="Test",
            camera_id="cam1",
        )

    with pytest.raises(ValueError):
        ZoneConfig(
            type=ZoneType.LINE,
            coordinates=[[0, 0]],
            name="Test",
            camera_id="cam1",
        )


def test_zones_to_geojson():
    from shared.utils.zones import zones_to_geojson

    zones = [
        Zone(
            id="zone1",
            config=ZoneConfig(
                type=ZoneType.POLYGON,
                coordinates=[[0, 0], [10, 0], [10, 10], [0, 10]],
                name="Polygon Zone",
                camera_id="cam1",
            ),
            created_at=0,
            updated_at=0,
        ),
        Zone(
            id="zone2",
            config=ZoneConfig(
                type=ZoneType.LINE,
                coordinates=[[0, 0], [10, 10]],
                name="Line Zone",
                camera_id="cam1",
            ),
            created_at=0,
            updated_at=0,
        ),
    ]

    geojson = zones_to_geojson(zones)
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 2
    assert geojson["features"][0]["geometry"]["type"] == "Polygon"
    assert geojson["features"][1]["geometry"]["type"] == "LineString"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])