# IBVAP — Intelligent Border Video Analytics Platform

A production-ready AI-powered video analytics platform for border surveillance, transforming existing CCTV infrastructure into an intelligent monitoring network using software-only computer vision.

## Features

| Capability | Status | Technology | Description |
|------------|--------|------------|-------------|
| **Human Detection & Tracking** | ✅ Done | YOLOv8 + ByteTrack | Real-time multi-target tracking with persistent Track IDs and direction vectors. |
| **Vehicle Detection & Classification** | ✅ Done | YOLOv8 + Speed Estimator | Classifies cars, trucks, buses, motorcycles with real-world calibrated speed (km/h) & overspeeding detection. |
| **Automatic Number Plate Recognition (ANPR)** | ✅ Done | YOLO-Plate + EasyOCR | High-accuracy vehicle registration extraction with SQLite log vault and `/anpr` UI dashboard (PaddleOCR supported as high-density alternate). |
| **Face Detection & Watchlist Recognition** | ✅ Done | RetinaFace + MobileFaceNet | Real-time facial feature vector matching against watchlist with instant blacklist security alarms. |
| **Virtual Fence Intrusion Detection** | ✅ Done | Point-in-Polygon + Dwell-Time | 4-point customizable restricted perimeter zones, loitering counters, and tripwires. |
| **Suspicious Activity & Anomaly Detection** | ✅ Done | Multi-Variate Threat Engine | Real-time detection of loitering, unattended baggage, brandished weapons, and fight anomalies. |
| **Night-Time & Low-Light Enhancement** | ✅ Done | CLAHE + Adaptive Retinex | Real-time dynamic contrast and luminance enhancement for zero-lux / night-vision feeds. |
| **Forensic Evidence Locker & Case Vault** | ✅ Done | SQLite + SHA-256 Hashes | Automatic high-resolution cropped incident snapshots, case search, and audit management. |
| **Multi-Rate Edge Inference Optimization** | ✅ Done | Kinematic Motion Interpolator | Frame-skipping with zero-latency velocity extrapolation and input frame scaling for low-end hardware. |
| **Real-time Alerts & Explainable Risk Scoring**| ✅ Done | Multi-Factor Continuous Engine | Dynamic risk calculation (0-100) correlating model confidence, dwell time, object type, and zone tier. |
| **Multi-Camera Surveillance Wall** | ✅ Done | OpenCV / MJPEG + Clean Standby | 8-channel live monitoring wall with real primary PTZ stream, thermal heatmap, and clean standby channels. |
| **Live Command Operations Dashboard** | ✅ Done | FastAPI + React 18 + TypeScript | Interactive command HUD with live MJPEG streams, clickable drill-down KPIs, and full REST API. |
| **C2 System & Export Integration** | 🚧 Backend ready, not yet in UI | REST Webhooks + Kafka / NATS | External Command & Control system dispatch and STANAG 4607 data interchange adapters. |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│ IP CAMERAS  │────▶│ STREAM INGEST│────▶│  DETECTION  │────▶│  TRACKING  │
│(RTSP/MP4/CAM│     │  (OpenCV/FF) │     │  (YOLOv8)   │     │ (ByteTrack)│
└─────────────┘     └──────────────┘     └─────────────┘     └─────┬──────┘
                                                                   │
                                           ┌───────────────────────┼──────────────────────┐
                                           ▼                       ▼                      ▼
                                 ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
                                 │    ANALYTICS     │    │      ALERTS      │    │  EVIDENCE VAULT  │
                                 │ (ANPR / Face /   │    │  (Risk Engine,   │    │ (SHA-256 Hashes, │
                                 │  Speed / Zones)  │    │   Explainable)   │    │  Cropped Snaps)  │
                                 └──────────────────┘    └──────────────────┘    └──────────────────┘
                                           │                       │                      │
                                           └───────────────────────┼──────────────────────┘
                                                                   ▼
                                                        ┌────────────────────┐
                                                        │    API GATEWAY     │
                                                        │ (FastAPI Backend)  │
                                                        └─────────┬──────────┘
                                                                  │
                                                        ┌─────────▼──────────┐
                                                        │ COMMAND DASHBOARD  │
                                                        │(React / TS / Vite) │
                                                        └────────────────────┘
```

## Project Structure

```
ibvap-project/
├── backend/                    # Python FastAPI application
│   ├── app/
│   │   ├── ai/                 # Core AI Computer Vision & Analytics Engines
│   │   │   ├── realtime_stream.py      # Unified live stream processor & MJPEG streamer
│   │   │   ├── speed_engine.py         # Calibrated vehicle speed & overspeeding estimator
│   │   │   ├── evidence_vault.py       # Forensic snapshot cropper & SQLite case vault
│   │   │   ├── motion_interpolator.py  # Kinematic trajectory interpolator (Edge optimization)
│   │   │   ├── face_engine.py          # Facial recognition & watchlist matcher
│   │   │   ├── anpr_engine.py          # License plate recognition & OCR pipeline
│   │   │   └── enhancer.py             # CLAHE & low-light video enhancement filter
│   │   ├── api/                # REST API routers (tracking, evidence, alerts, streams, anpr)
│   │   ├── services/           # Business services (risk_engine.py, alert_service.py)
│   │   ├── schemas/            # Pydantic v2 data models
│   │   └── main.py             # FastAPI entry point & static asset distributor
│   └── tests/                  # Automated pytest test suite
│
├── frontend/                   # React 18 + TypeScript + TailwindCSS + Vite
│   ├── src/
│   │   ├── pages/              # CommandCenter, LiveSurveillance, PeopleObjects, EvidenceVault, ANPR
│   │   ├── components/         # Modular UI widgets, video players, alerts, modals
│   │   ├── stores/             # Zustand state management (videoStore, appStore, authStore)
│   │   └── layouts/            # DashboardLayout with dynamic pipeline status banner
│   └── dist/                   # Production compiled static distribution
│
├── scripts/                    # Deployment & Automation Utilities
│   ├── deploy.bat              # Windows 1-click production launcher
│   ├── deploy.sh               # Linux / Cloud VPS deployment launcher
│   ├── push_to_github.py       # Automated Git repository push utility
│   ├── push_to_github.bat      # Windows batch wrapper for GitHub push
│   ├── clean_and_commit.py     # Git tree cleaner and optimizer
│   └── create_bundle.py        # Standalone release packager (<50MB, <100 files)
│
├── docs/                       # Project Documentation & Screenshots
│   └── screenshots/            # Visual dashboard interface captures
│
├── known_faces/                # Watchlist reference face gallery
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # Multi-service container orchestration
├── export_onnx.py              # YOLOv8 ONNX / TensorRT model exporter
├── requirements.txt            # Python dependencies
└── run.py                      # Unified application runner
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (for building frontend)
- NVIDIA GPU (CUDA enabled) or CPU fallback

> [!NOTE]
> **Automatic AI Model Weights Download**: You do not need to manually download or commit model weight binaries (`yolov8n.pt`, `*.onnx`) to the repository. The platform uses Ultralytics' native automated weight management (`YOLO("yolov8n.pt")`), which automatically fetches and caches the official lightweight model on first execution without repository bloat.

### 1-Click Launch (Windows)
```cmd
scripts\deploy.bat
```

### 1-Click Launch (Linux / Cloud VPS)
```bash
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

### Manual Installation & Running
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build Frontend (if modifying UI)
cd frontend
npm install
npm run build
cd ..

# 3. Start Full-Power Production Server
python run.py
```

## Screenshots & Interface Overview

Visual captures of the active platform interface are located in [docs/screenshots/](file:///c:/Users/siddh/Downloads/ibvap-main/ibvap-main/docs/screenshots/):
* **Tactical Command Center HUD:** [http://localhost:8000/](http://localhost:8000/)
* **Multi-Channel Surveillance Wall:** [http://localhost:8000/surveillance](http://localhost:8000/surveillance)
* **Real-Time Detection & Tracking Feed:** [http://localhost:8000/tracking](http://localhost:8000/tracking)
* **Forensic Evidence Vault & Case Locker:** [http://localhost:8000/evidence](http://localhost:8000/evidence)

## API Endpoints Reference

The IBVAP platform exposes a REST API, WebSocket streams, and Server-Sent Events (SSE) across vision analytics, tracking, forensics, security alerts, and system controls:

### 1. Live AI Video Streaming & Heatmaps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/video_feed` | Real-time MJPEG live stream with annotated YOLOv8 bounding boxes, ByteTrack IDs, ANPR plates, and speed badges |
| GET | `/heatmap` | Cumulative foot-traffic movement heatmap MJPEG video stream |
| GET | `/api/stream/feed` | Direct API stream alias for high-throughput video consumers |
| GET | `/api/stream/heatmap` | Direct API stream alias for thermal motion analysis |
| GET | `/api/stream/snapshot` | Raw uncompressed JPEG frame for 4-point polygon calibration |
| GET | `/api/stream/density` | Real-time crowd count, active in-frame persons, and overcrowding status |
| POST | `/api/density/threshold`| Configure overcrowding threshold limit |
| POST | `/api/heatmap/reset` | Reset accumulated foot-traffic heatmap density buffer |
| GET / POST | `/api/stream/source` | Query or switch video source (Webcam `0`, sample MP4, or RTSP camera URL) |

### 2. Subject & Vehicle Tracking Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tracking` | Web dashboard page for real-time subject and vehicle monitoring |
| GET | `/api/tracks/feed` | Real-time live track feed (Track IDs, ANPR badges, direction vectors, speed, certainty) |
| GET | `/api/tracks/stats` | Tracking KPI summary (Total people, total vehicles, active in-frame tracks, avg confidence) |
| GET | `/api/tracking/trajectories` | Multi-point trajectory history coordinates per tracked subject |

### 3. Automatic Number Plate Recognition (ANPR)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/anpr` | Web dashboard page for license plate log review and search |
| GET | `/api/anpr/reads` | List historical vehicle registration scans with confidence and timestamps |
| GET | `/api/anpr/stats` | Plate scan volume, OCR accuracy rates, and unique vehicle counts |
| GET | `/api/anpr/allowlist` | Query vehicle allowlist and blocklist records |
| POST | `/api/anpr/allowlist` | Add new authorized or flagged vehicle license plate |

### 4. Virtual Fences & Perimeter Zones
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/virtual-fences` | Interactive zone definition and perimeter monitoring page |
| GET | `/api/stream/zone` | Active 4-point restricted polygon coordinates |
| POST | `/api/stream/zone` | Update restricted zone polygon vertices interactively from UI modal |
| GET | `/api/zones` | List all configured polygon and tripwire security zones |
| POST | `/api/zones` | Register new restricted zone with custom dwell thresholds |
| DELETE | `/api/zones/{id}` | Remove security zone |

### 5. Threat Alerts & Explainable Risk Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Alert management dashboard with explainable risk breakdown |
| GET | `/api/stream/alerts` | Live threat alert array with continuous risk score (0-100) and factor breakdowns |
| GET | `/api/alerts/stream` | Server-Sent Events (SSE) stream for real-time alert dispatch |
| WS | `/ws/alerts` | Full-duplex WebSocket stream for live security alert pushes |
| WS | `/ws/events` | High-frequency telemetry WebSocket for real-time bounding boxes and detections |
| GET | `/api/alerts` | List historical security alerts with filtering by severity and status |
| POST | `/api/alerts/{id}/acknowledge` | Mark security alert as acknowledged / resolved |

### 6. Forensic Evidence Locker & Case Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/evidence` | Forensic case review vault with snapshot modal previewer |
| GET | `/api/evidence/search` | Filter forensic cases by object type, alert classification, severity, camera, or date |
| GET | `/api/evidence/stats` | Total evidence cases, severity distribution, and vault integrity status |
| GET | `/api/evidence/snapshot/{filename}` | High-resolution cropped snapshot image for forensic audit (Path traversal secured) |
| GET | `/api/evidence/{case_id}` | Retrieve individual case details and forensic audit metadata |

### 7. Face Recognition Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faces/watchlist` | Query enrolled watchlist facial identities and blacklist security flags |
| POST | `/api/faces/reload` | Hot-reload facial embedding database from gallery storage |

### 8. Edge Optimization & Night-Vision Enhancement
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | AI Model Center dashboard page for optimizer controls |
| GET / POST | `/api/stream/performance` | Query or configure edge frame-skipping ($N$) and downscaled inference resolution ($640\times 384$) |
| GET / POST | `/api/stream/enhancer` | Query or toggle low-light CLAHE / Retinex adaptive contrast filter |

### 9. Cameras & System Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/surveillance` | 8-camera multi-channel surveillance wall grid |
| GET | `/command-center` | Central tactical operations dashboard |
| GET | `/api/cameras` | List all connected camera nodes, RTSP sources, and online states |
| POST | `/api/cameras` | Register new RTSP / IP camera feed |
| GET | `/api/cameras/{id}/health` | Real-time camera ping, FPS rate, and connection quality |
| GET | `/api/health` | System health check and engine capability matrix |

Full interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`

## Testing

Run the automated backend test suite:
```bash
python -m pytest backend/tests/ -v
```

## License

MIT — Free for commercial and governmental deployment.