from ultralytics import YOLO
import cv2
import numpy as np
from collections import defaultdict, deque
import time

model = YOLO("yolov8n.pt")

video_path = "test.mp4"
cap = cv2.VideoCapture(video_path)

# Define configurable restricted zone polygon (Nx2 coordinates)
zone_polygon = np.array([
    [400, 200],
    [900, 200],
    [950, 600],
    [350, 600]
], dtype=np.int32)

track_histories = defaultdict(lambda: deque(maxlen=30))
zone_entry_timestamps = {}

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    current_time = time.time()
    annotated = frame.copy()

    # 1. Semi-transparent polygon overlay
    overlay = annotated.copy()
    cv2.fillPoly(overlay, [zone_polygon], color=(0, 255, 255))
    cv2.addWeighted(overlay, 0.25, annotated, 0.75, 0, annotated)
    cv2.polylines(annotated, [zone_polygon], isClosed=True, color=(0, 200, 255), thickness=2, lineType=cv2.LINE_AA)
    cv2.putText(annotated, "RESTRICTED PERIMETER", (zone_polygon[0][0], max(25, zone_polygon[0][1] - 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2, cv2.LINE_AA)

    # 2. Run ByteTrack on top of YOLO detections (conf=0.35, iou=0.5)
    results = model.track(frame, persist=True, tracker="bytetrack.yaml", conf=0.35, iou=0.5, verbose=False)

    tracked_objects = []
    active_ids = set()

    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.cpu().numpy().astype(int)
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        confidences = results[0].boxes.conf.cpu().numpy().astype(float)

        for box, track_id, cls_id, conf in zip(boxes, track_ids, classes, confidences):
            x1, y1, x2, y2 = map(int, box)
            class_name = model.names[cls_id]

            if class_name not in ["person", "car", "truck", "bus", "motorcycle", "backpack", "suitcase"]:
                continue

            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            foot_x, foot_y = cx, y2

            active_ids.add(track_id)
            track_histories[track_id].append((cx, cy))
            tracked_objects.append([x1, y1, x2, y2, track_id, class_name, round(conf, 4)])

            # Robust Multi-Point Intrusion (Centroid + Ground Footprint)
            in_c = cv2.pointPolygonTest(zone_polygon, (float(cx), float(cy)), False) >= 0
            in_f = cv2.pointPolygonTest(zone_polygon, (float(foot_x), float(foot_y)), False) >= 0
            inside_fence = in_c or in_f

            if inside_fence:
                if track_id not in zone_entry_timestamps:
                    zone_entry_timestamps[track_id] = current_time
                dwell_sec = current_time - zone_entry_timestamps[track_id]

                color = (0, 50, 200) if dwell_sec >= 3.0 else (0, 0, 255)
                text = f"LOITERING ({dwell_sec:.1f}s) ID #{track_id}: {class_name.upper()}" if dwell_sec >= 3.0 else f"ALERT ID #{track_id}: {class_name.upper()} ({conf:.0%})"
                print(f"[ALERT] Track #{track_id} ({class_name}) inside zone for {dwell_sec:.1f}s at ({cx}, {cy})")
            else:
                if track_id in zone_entry_timestamps:
                    del zone_entry_timestamps[track_id]
                color = (0, 255, 0)
                text = f"ID #{track_id}: {class_name} ({conf:.0%})"

            # Draw Motion Trajectory Line
            history = list(track_histories[track_id])
            for i in range(1, len(history)):
                cv2.line(annotated, history[i - 1], history[i], (0, 220, 255), 2, cv2.LINE_AA)

            # Draw Bounding Box & Centroid Dot
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
            cv2.circle(annotated, (foot_x, foot_y), 4, (0, 0, 255) if inside_fence else (0, 255, 255), -1)

            # Draw Label Pill
            (tw, th), bl = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 6, y1 + bl), color, cv2.FILLED)
            cv2.putText(annotated, text, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.imshow("IBVAP - Enterprise Tracking & Multi-Point Fence", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()