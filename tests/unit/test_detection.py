import pytest
from shared.schemas.detection import Detection, DetectionBatch, BoundingBox
from datetime import datetime


def test_bounding_box():
    bbox = BoundingBox(x1=10, y1=20, x2=110, y2=120)

    assert bbox.width == 100
    assert bbox.height == 100
    assert bbox.center == (60.0, 70.0)
    assert bbox.area() == 10000
    assert bbox.to_xywh() == (10, 20, 100, 100)
    assert bbox.to_xyxy() == (10, 20, 110, 120)


def test_bounding_box_iou():
    bbox1 = BoundingBox(x1=0, y1=0, x2=100, y2=100)
    bbox2 = BoundingBox(x1=50, y1=50, x2=150, y2=150)

    iou = bbox1.iou(bbox2)
    assert abs(iou - 0.142857) < 0.001

    bbox3 = BoundingBox(x1=200, y1=200, x2=300, y2=300)
    assert bbox1.iou(bbox3) == 0.0


def test_detection():
    bbox = BoundingBox(x1=10, y1=20, x2=110, y2=120)
    det = Detection(
        class_id=0,
        class_name="person",
        confidence=0.95,
        bbox=bbox,
        track_id=1,
    )

    assert det.center == (60.0, 70.0)
    assert det.class_name == "person"
    assert det.confidence == 0.95


def test_detection_batch():
    bbox = BoundingBox(x1=10, y1=20, x2=110, y2=120)
    det = Detection(
        class_id=0,
        class_name="person",
        confidence=0.95,
        bbox=bbox,
    )

    batch = DetectionBatch(
        camera_id="cam1",
        frame_id=1,
        timestamp=datetime.utcnow(),
        detections=[det],
        inference_time_ms=25.5,
        image_shape=(720, 1280),
    )

    assert batch.camera_id == "cam1"
    assert len(batch.detections) == 1
    assert batch.inference_time_ms == 25.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])