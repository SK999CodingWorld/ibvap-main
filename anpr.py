from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from ultralytics import YOLO
import cv2
import threading
import time
import easyocr

app = FastAPI()
model = YOLO("yolov8n.pt")
reader = easyocr.Reader(['en'], gpu=False)
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

video_path = "test.mp4"

FENCE_X1, FENCE_Y1 = 400, 200
FENCE_X2, FENCE_Y2 = 900, 600

latest_frame = None
alerts = []
last_alert_time = {}
ALERT_COOLDOWN = 5
lock = threading.Lock()


def process_video():
    global latest_frame
    cap = cv2.VideoCapture(video_path)
    frame_count = 0

    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        frame_count += 1
        results = model(frame, verbose=False)

        cv2.rectangle(frame, (FENCE_X1, FENCE_Y1), (FENCE_X2, FENCE_Y2), (0, 255, 255), 2)
        cv2.putText(frame, "RESTRICTED ZONE", (FENCE_X1, FENCE_Y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        face_count_this_frame = 0

        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            if label not in ["person", "car", "truck", "bus", "motorcycle"]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
            inside = (FENCE_X1 < center_x < FENCE_X2) and (FENCE_Y1 < center_y < FENCE_Y2)

            color = (0, 0, 255) if inside else (0, 255, 0)
            text = f"ALERT: {label}" if inside else label

            plate_text = None
            if label in ["car", "truck", "bus", "motorcycle"] and frame_count % 10 == 0:
                vehicle_crop = frame[y1:y2, x1:x2]
                if vehicle_crop.size > 0 and vehicle_crop.shape[0] > 10 and vehicle_crop.shape[1] > 10:
                    scale = 2
                    upscaled = cv2.resize(vehicle_crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                    gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
                    gray = cv2.equalizeHist(gray)
                    ocr_results = reader.readtext(gray)
                    best_conf = 0
                    for (bbox, ocr_text, confidence) in ocr_results:
                        cleaned = ocr_text.strip().replace(" ", "")
                        if confidence > 0.15 and len(cleaned) >= 3 and confidence > best_conf:
                            plate_text = cleaned
                            best_conf = confidence

            if label == "person":
                person_crop = frame[max(0, y1):y2, max(0, x1):x2]
                if person_crop.size > 0:
                    gray_face = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray_face, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))
                    for (fx, fy, fw, fh) in faces:
                        abs_x1, abs_y1 = x1 + fx, y1 + fy
                        abs_x2, abs_y2 = abs_x1 + fw, abs_y1 + fh
                        cv2.rectangle(frame, (abs_x1, abs_y1), (abs_x2, abs_y2), (255, 0, 255), 2)
                        cv2.putText(frame, "face", (abs_x1, abs_y1 - 5),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 255), 1)
                        face_count_this_frame += 1

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if plate_text:
                cv2.putText(frame, f"Plate: {plate_text}", (x1, y2 + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

            if inside:
                now = time.time()
                with lock:
                    last_time = last_alert_time.get(label, 0)
                    if now - last_time > ALERT_COOLDOWN:
                        alerts.insert(0, {
                            "time": time.strftime("%H:%M:%S"),
                            "type": f"{label} intrusion",
                            "plate": plate_text if plate_text else "—",
                        })
                        alerts[:] = alerts[:20]
                        last_alert_time[label] = now

        cv2.putText(frame, f"Faces detected: {face_count_this_frame}", (10, frame.shape[0] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

        _, buffer = cv2.imencode(".jpg", frame)
        with lock:
            latest_frame = buffer.tobytes()

        time.sleep(0.03)


threading.Thread(target=process_video, daemon=True).start()


def generate_stream():
    while True:
        with lock:
            frame = latest_frame
        if frame is not None:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(0.03)


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_stream(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/alerts")
def get_alerts():
    with lock:
        return JSONResponse(alerts)


@app.get("/", response_class=HTMLResponse)
def dashboard():
    return """
    <html>
    <head>
        <title>IBVAP Dashboard</title>
        <style>
            body { background:#111; color:#eee; font-family:sans-serif; display:flex; }
            .video { flex:2; padding:10px; }
            .alerts { flex:1; padding:10px; background:#1a1a1a; height:95vh; overflow-y:auto; }
            img { width:100%; border-radius:8px; }
            .alert-item { background:#2a2a2a; margin:6px 0; padding:8px; border-left:4px solid red; border-radius:4px; }
            .plate { color:#4ea8ff; font-weight:bold; }
            h2 { color:#0f0; }
        </style>
    </head>
    <body>
        <div class="video">
            <h2>IBVAP — Live Feed</h2>
            <img src="/video_feed">
        </div>
        <div class="alerts">
            <h2>Alerts</h2>
            <div id="alertList"></div>
        </div>
        <script>
            async function refreshAlerts() {
                const res = await fetch('/alerts');
                const data = await res.json();
                const list = document.getElementById('alertList');
                list.innerHTML = data.map(a =>
                    `<div class="alert-item"><b>${a.type}</b><br>${a.time}<br><span class="plate">Plate: ${a.plate}</span></div>`
                ).join('');
            }
            setInterval(refreshAlerts, 2000);
            refreshAlerts();
        </script>
    </body>
    </html>
    """