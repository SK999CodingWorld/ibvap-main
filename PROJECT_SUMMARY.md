# IBVAP — Complete Project Summary

## Project Overview

**IBVAP (Intelligent Border Video Analytics Platform)** — A production-ready, AI-powered video analytics platform for border surveillance that transforms existing CCTV infrastructure into an intelligent monitoring network using software-only computer vision.

## Completed Phases

| Phase | Duration | Status | Description |
|-------|----------|--------|-------------|
| **Phase 1** | Weeks 1-3 | ✅ Complete | Core detection & tracking engine |
| **Phase 2** | Weeks 4-6 | ✅ Complete | Advanced analytics (ANPR, Face, Behavior, Night) |
| **Phase 3** | Weeks 7-9 | ✅ Complete | Multi-camera management & streaming |
| **Phase 4** | Weeks 10-12 | ✅ Complete | Alerting, logging & React dashboard |
| **Phase 5** | Weeks 13-16 | 🚧 In Progress | Deployment, optimization & hardening |

## Tech Stack

### Backend
- **FastAPI** — Async REST API with auto OpenAPI docs
- **Redis Streams** — High-performance inter-service messaging
- **PostgreSQL + TimescaleDB** — Event storage & time-series data
- **Ultralytics YOLOv8** — Object detection (person, vehicle classes)
- **BoT-SORT / ByteTrack** — Multi-object tracking
- **OpenCV + FFmpeg** — RTSP stream ingestion & video processing

### AI/Analytics
- **YOLOv8** — Detection (configurable: n/s/m/l/x)
- **PaddleOCR / EasyOCR** — License plate recognition (ANPR)
- **InsightFace (ArcFace)** — Face recognition with watchlist
- **YOLOv8-Pose** — Behavior analysis (running, loitering, fall detection)
- **Retinex/Gamma/CLAHE** — Night-time image enhancement

### Frontend
- **React 18 + TypeScript + Vite** — Modern SPA
- **Tailwind CSS** — Utility-first styling
- **Leaflet** — Geographic camera map view
- **Recharts** — Analytics visualization
- **Socket.io** — Real-time updates

### Infrastructure
- **Docker / Docker Compose** — Containerized deployment
- **Supervisor** — Process management (production)
- **Nginx** — Reverse proxy & static file serving
- **K3s** — Lightweight Kubernetes (edge deployment)

## Project Structure

```
ibvap-project/
├── main.py                    # FastAPI application entry point
├── run.py                     # Development runner (api/detector/tracker/docker)
├── docker-compose.yml         # Full stack deployment
├── Dockerfile / Dockerfile.detector
├── requirements.txt           # Python dependencies
├── zones.json                 # Zone configurations (polygon, line, circle)
├── .env.example               # Environment template
├── TECH_DESIGN.md             # Technical design document
├── README.md                  # User documentation
│
├── services/                  # Microservices (Phase 1-3)
│   ├── stream_ingest/         # Camera management + FFmpeg RTSP ingestion
│   ├── detection_worker/      # YOLOv8 inference (GPU-accelerated)
│   ├── tracking_service/      # BoT-SORT tracking + zone logic
│   ├── alert_engine/          # Rule-based alerting with cooldown/dedup
│   ├── camera_registry/       # Camera CRUD + JSON persistence
│   ├── recording_service/     # Circular buffer + event clips + evidence export
│   ├── ptz_control/           # ONVIF PTZ control (presets, absolute/relative)
│   └── analytics/
│       ├── anpr_worker/       # License plate detection + OCR
│       ├── face_worker/       # Face detection + recognition (watchlist)
│       ├── behavior_worker/   # Pose estimation (running, loitering, falls)
│       └── night_enhance/     # Retinex/gamma/CLAHE night enhancement
│
├── shared/                    # Shared libraries
│   ├── schemas/               # Pydantic models (Camera, Detection, Track, Alert, Zone, Event)
│   ├── messaging/             # Redis Streams + PubSub
│   ├── config/                # Pydantic Settings management
│   └── utils/                 # Vision helpers (drawing, geometry, NMS, zones)
│
├── tests/                     # Unit & integration tests
│   └── unit/                  # Zone logic, detection schemas
│
├── deploy/                    # Deployment configs
│   ├── scripts/
│   │   ├── install.sh         # Production installer (Ubuntu/Debian/RHEL)
│   │   └── backup.sh          # Automated backup script
│   └── kubernetes/            # K3s manifests (planned)
│
└── dashboard/                 # React + TypeScript + Vite (Phase 4)
    ├── src/
    │   ├── pages/             # Dashboard, Cameras, Alerts, Recordings, Map, PTZ, Settings
    │   ├── components/        # Layout, UI components (Card, etc.)
    │   ├── hooks/             # React hooks for data fetching
    │   ├── api/               # Axios client + TypeScript types
    │   └── lib/               # Utilities
    └── public/
```

## Key Features Implemented

### Core Detection & Tracking
- ✅ Multi-camera RTSP ingestion with auto-reconnect
- ✅ YOLOv8 detection (person, car, truck, bus, motorcycle, bicycle)
- ✅ BoT-SORT tracking with persistent track IDs
- ✅ Virtual fence zones: polygon, rectangle, line, circle
- ✅ Zone events: entry, exit, dwell-time, line crossing (directional)

### Advanced Analytics
- ✅ ANPR: Plate detection + PaddleOCR/EasyOCR
- ✅ Face Recognition: InsightFace + watchlist management
- ✅ Behavior: Running, loitering, fall detection via pose estimation
- ✅ Night Enhancement: Retinex + gamma + CLAHE

### Alerting & Recording
- ✅ Rule engine with cooldown, severity, webhook/email
- ✅ Circular buffer recording (300s segments)
- ✅ Event-triggered clips (pre/post event)
- ✅ Evidence export by time range
- ✅ Retention policy cleanup

### Camera Management
- ✅ Camera registry (CRUD, health monitoring)
- ✅ ONVIF PTZ control (absolute, relative, continuous, presets)
- ✅ GPS coordinates for map view

### Dashboard (React)
- ✅ Live camera grid with status
- ✅ Real-time alerts panel with acknowledgment
- ✅ Geographic map with camera markers
- ✅ PTZ control panel with directional controls
- ✅ Recordings browser with event filtering
- ✅ Settings: detection, tracking, alerts, recording, DB

## API Endpoints

| Category | Endpoints |
|----------|-----------|
| **Health** | `GET /health` |
| **Cameras** | `POST/GET/PATCH/DELETE /cameras`, `GET /cameras/{id}/health` |
| **Alerts** | `GET/POST/DELETE /alerts/rules`, `GET /alerts`, `POST /alerts/{id}/acknowledge` |
| **Recordings** | `GET /recordings/storage`, `GET /recordings/cameras/{id}/clips`, `POST /recordings/cameras/{id}/evidence` |
| **PTZ** | `POST /ptz/cameras/{id}/initialize`, `POST /ptz/cameras/{id}/move/*`, `POST/GET /ptz/cameras/{id}/presets` |
| **Analytics** | `POST/GET/DELETE /analytics/face/watchlist` |

## Hardware Targets

| Device | GPU | Cameras @ 1080p30 | Use Case |
|--------|-----|-------------------|----------|
| Jetson Nano | 0.5 TOPS | 2-4 | Minimum |
| Jetson Orin NX 16GB | 70 TOPS | 12-16 | Standard |
| Jetson Orin AGX 64GB | 275 TOPS | 40+ | High-density |
| x86 + RTX 4070 | 300+ TOPS | 100+ | Server |

## Quick Start

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run all-in-one (development)
python run.py api --reload

# Or microservices:
python run.py api        # Terminal 1: API + Stream ingest
python run.py detector   # Terminal 2: GPU detection worker
python run.py tracker    # Terminal 3: Tracking service

# 4. Add camera via API
curl -X POST http://localhost:8000/cameras \
  -H "Content-Type: application/json" \
  -d '{"name": "BOP-North", "protocol": "rtsp", "stream_url": "rtsp://...", "enabled": true}'

# 5. Open dashboard
# http://localhost:8000/docs (API) or http://localhost:3000 (React dashboard after build)
```

## Deployment

```bash
# Production install (Ubuntu/Debian)
sudo ./deploy/scripts/install.sh

# Backup
./deploy/scripts/backup.sh full
```

## Next Steps (Phase 5)

- [ ] TensorRT INT8 model optimization for Jetson
- [ ] K3s manifests for edge orchestration
- [ ] Air-gapped installation bundle
- [ ] STANAG 4607 / KLV metadata export
- [ ] Distributed tracing (Jaeger)
- [ ] Model drift detection & retraining pipeline
- [ ] Advanced behavior: fight detection, crowd formation
- [ ] Mobile app for field operators