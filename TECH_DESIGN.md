# IBVAP — Technical Design Document

## Problem Analysis

**Core Challenge**: Transform existing IP CCTV infrastructure into an intelligent border surveillance platform using software-only AI/ML, eliminating need for specialized hardware.

**Key Requirements**:
| Requirement | Priority | Complexity |
|-------------|----------|------------|
| Human detection & tracking | P0 | Medium |
| Vehicle detection & classification | P0 | Medium |
| Face detection | P0 | Medium |
| ANPR | P0 | High |
| Virtual fence intrusion detection | P0 | Low |
| Suspicious activity detection | P1 | High |
| Night-time movement detection | P1 | Medium |
| Real-time alerts & event logging | P0 | Medium |
| Multi-camera IP stream ingestion | P0 | Medium |
| Integration with C2 systems | P1 | High |
| Edge deployment (remote/low-bandwidth) | P0 | High |

---

## Recommended Tech Stack

### Core AI/ML
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Object Detection | **YOLOv8/v11** (Ultralytics) | SOTA speed/accuracy, ONNX/TensorRT export, tracking built-in |
| Tracking | **BoT-SORT / ByteTrack** (built into Ultralytics) | Robust multi-object tracking, handles occlusion |
| Face Detection | **SCRFD / RetinaFace** (InsightFace) | Better than Haar for varying poses/lighting |
| Face Recognition | **ArcFace / AdaFace** (InsightFace) | 512-d embeddings, high accuracy on LFW |
| ANPR | **YOLOv8-plate + PaddleOCR / EasyOCR** | Specialized plate detector + strong OCR |
| Pose/Behavior | **YOLOv8-pose / RTMPose** | Keypoints for fall, loitering, fighting detection |
| Night Enhancement | **EnlightenGAN / Retinex / YOLO-NAS** | Low-light enhancement before detection |

### Backend & Infrastructure
| Layer | Technology | Rationale |
|-------|------------|-----------|
| API Framework | **FastAPI** | Async, high performance, auto OpenAPI docs |
| Message Bus | **Redis Streams / NATS** | Lightweight, pub/sub for alerts, inter-service |
| Database | **PostgreSQL + TimescaleDB** | Relational + time-series for events/metrics |
| Cache | **Redis** | Frame buffers, session, rate limiting |
| Stream Ingestion | **FFmpeg / GStreamer (Python bindings)** | RTSP/HLS/HTTP-FLV support, hardware decode |
| Video Recording | **FFmpeg segmenter** | MP4/WebM chunks, circular buffer |
| Task Queue | **Celery + Redis** | Async processing (ANPR, face enrollment) |
| Containerization | **Docker + Docker Compose** | Edge deployment, dependency isolation |
| Orchestration (optional) | **K3s / k0s** | Lightweight Kubernetes for multi-node |

### Edge Optimization
| Technique | Implementation |
|-----------|----------------|
| Model Optimization | ONNX → TensorRT (FP16/INT8), NCNN for ARM |
| Inference Server | **Triton Inference Server** or **YOLO exported ONNX + ONNX Runtime** |
| Hardware Accel | CUDA (NVIDIA Jetson), OpenVINO (Intel), CoreML (Apple), RKNN (Rockchip) |
| Stream Handling | GStreamer `rtspsrc` → `appsink` → numpy, zero-copy where possible |

### Frontend & Dashboard
| Layer | Technology |
|-------|------------|
| Framework | **React + TypeScript + Vite** |
| Real-time | **WebSocket (Socket.io)** or Server-Sent Events |
| Video | **MJPEG / HLS (hls.js) / WebRTC (MediaMTX)** |
| Maps | **Leaflet / MapLibre GL** for camera geo-location |
| Charts | **Recharts / Apache ECharts** |
| UI Kit | **Tailwind CSS + shadcn/ui** |

### Observability & DevOps
| Area | Tools |
|------|-------|
| Logging | **Loki + Promtail** or **ELK** |
| Metrics | **Prometheus + Grafana** |
| Tracing | **Jaeger / Tempo** |
| CI/CD | **GitHub Actions / GitLab CI** |
| Config | **Pydantic Settings (.env)**, Consul/etcd for distributed |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            IBVAP SYSTEM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────┐  │
│  │  IP CAMERAS  │───▶│         STREAM INGESTION SERVICE                  │  │
│  │  (RTSP/HTTP) │    │  • FFmpeg/GStreamer per camera                    │  │
│  └──────────────┘    │  • Reconnection, health checks, HW decode         │  │
│                      │  • Frame distribution (Redis Streams / shared mem)│  │
│                      └────────────────────┬──────────────────────────────┘  │
│                                           │                                 │
│         ┌─────────────────────────────────┼─────────────────────────────┐   │
│         ▼                                 ▼                             ▼   │
│  ┌───────────────┐               ┌───────────────┐             ┌───────────────┐
│  │ DETECTION     │               │ TRACKING      │             │ ANALYTICS     │
│  │ WORKER POOL   │               │ SERVICE       │             │ WORKERS       │
│  │ • YOLOv8      │──────────────▶│ • BoT-SORT    │────────────▶│ • ANPR        │
│  │ • Pose        │  frame+det    │ • Track mgmt  │  tracks     │ • Face Recog  │
│  │ • Plate Det   │               │ • Zone logic  │             │ • Behavior    │
│  └───────────────┘               └───────────────┘             │ • Night Enh   │
│                                                                └───────┬───────┘
│                                                                        │
│                                           ┌────────────────────────────┘
│                                           ▼
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  │ ALERT        │    │ EVENT        │    │ RECORDING    │    │ API GATEWAY  │
│  │ ENGINE       │    │ STORE        │    │ SERVICE      │    │ (FastAPI)    │
│  │ • Rules      │    │ • PostgreSQL │    │ • Clips      │    │ • REST       │
│  │ • Dedup      │    │ • Timescale  │    │ • Timelapse  │    │ • WS/SSE     │
│  │ • Webhooks   │    │ • Redis      │    │ • Evidence   │    │ • Auth       │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
│                                                                        │
│                                    ┌───────────────────────────────────┘
│                                    ▼
│                         ┌─────────────────────┐
│                         │   DASHBOARD (React) │
│                         │ • Live multi-cam    │
│                         │ • Alert timeline    │
│                         │ • Search/replay     │
│                         │ • Map view          │
│                         └─────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow**:
1. **Stream Ingestion** pulls RTSP → decodes → pushes frames to Redis Streams (per camera)
2. **Detection Workers** consume frames → run YOLO → publish detections
3. **Tracking Service** consumes detections → maintains tracks → evaluates zones/rules
4. **Analytics Workers** (async) process crops for ANPR, face, behavior
5. **Alert Engine** evaluates rules → deduplicates → stores + pushes to WebSocket
6. **API Gateway** serves dashboard, handles camera config, exports events

---

## Development Phases

### Phase 1: Core Detection & Tracking Engine (Weeks 1-3)
**Goal**: Reliable multi-class detection + tracking on single stream

| Task | Details |
|------|---------|
| 1.1 | Stream ingestion service (FFmpeg + async frame queue) |
| 1.2 | YOLOv8 detection worker (person, vehicle classes) |
| 1.3 | BoT-SORT/ByteTrack integration (Ultralytics built-in) |
| 1.4 | Virtual fence: polygon zones, entry/exit/dwell rules |
| 1.5 | Basic alert: zone intrusion, line crossing |
| 1.6 | Unit tests + synthetic test videos |

**Deliverable**: `docker run ibvap-core --source rtsp://... --zones zones.json`

---

### Phase 2: Advanced Analytics (Weeks 4-6)
**Goal**: ANPR, Face Recognition, Behavior Analysis

| Task | Details |
|------|---------|
| 2.1 | License plate detector (YOLOv8-plate) + PaddleOCR |
| 2.2 | Face detection (SCRFD) + recognition (ArcFace) |
| 2.3 | Face enrollment API + watchlist management |
| 2.4 | Pose estimation (YOLOv8-pose) → behavior rules: loitering, fall, running, grouping |
| 2.5 | Night enhancement preprocessing (Retinex/EnlightenGAN) |
| 2.6 | Analytics worker pool (Celery) for async heavy tasks |

**Deliverable**: Analytics microservices with REST/gRPC interfaces

---

### Phase 3: Multi-Camera Management (Weeks 7-9)
**Goal**: Scale to 50+ cameras per edge node

| Task | Details |
|------|---------|
| 3.1 | Camera registry (CRUD, health, PTZ control via ONVIF) |
| 3.2 | Stream manager: auto-reconnect, load balancing across workers |
| 3.3 | Hardware decode (NVDEC/QSV) + zero-copy frame passing |
| 3.4 | Recording service: circular buffer (30d), event clips, evidence export |
| 3.5 | Bandwidth optimization: adaptive bitrate, ROI encoding |
| 3.6 | Edge sync: offline-first, sync when connectivity restored |

**Deliverable**: Multi-camera edge node with web config UI

---

### Phase 4: Alerting, Logging & Dashboard (Weeks 10-12)
**Goal**: Operational dashboard + alerting + C2 integration

| Task | Details |
|------|---------|
| 4.1 | Alert engine: rule DSL, cooldown, escalation, webhooks |
| 4.2 | Event store: PostgreSQL + TimescaleDB (partitioned by time) |
| 4.3 | Dashboard: live grid, camera map, alert timeline, search/replay |
| 4.4 | WebRTC streaming (MediaMTX) for sub-second latency |
| 4.5 | Auth: JWT + RBAC (admin, operator, viewer) |
| 4.6 | C2 integration: REST webhook, Kafka/NATS export, STANAG 4607 |

**Deliverable**: Full dashboard + API for external systems

---

### Phase 5: Deployment, Optimization & Hardening (Weeks 13-16)
**Goal**: Production-ready edge deployment

| Task | Details |
|------|---------|
| 5.1 | Model optimization: ONNX → TensorRT INT8, benchmark on Jetson Orin |
| 5.2 | Docker images: multi-arch (amd64, arm64), <2GB |
| 5.3 | Offline install: air-gapped bundle with all models/weights |
| 5.4 | Config management: GitOps (ArgoCD/Flux) or Ansible |
| 5.5 | Hardening: TLS, secrets (Vault/SealedSecrets), audit logs |
| 5.6 | Stress test: 100 cams, 30d soak, failover chaos testing |
| 5.7 | Documentation: runbooks, API specs, model cards |

**Deliverable**: Production release + deployment guide

---

## Project Structure (Target)

```
ibvap/
├── docker-compose.yml           # Full stack
├── docker-compose.edge.yml      # Edge minimal
├── .env.example
├── Makefile
│
├── services/
│   ├── stream-ingest/           # FFmpeg/GStreamer → Redis Streams
│   ├── detection-worker/        # YOLO inference (GPU)
│   ├── tracking-service/        # BoT-SORT, zone logic
│   ├── analytics/
│   │   ├── anpr-worker/         # Plate detect + OCR
│   │   ├── face-worker/         # Detect + embed + match
│   │   ├── behavior-worker/     # Pose → rules
│   │   └── night-enhance/       # Preprocessing
│   ├── alert-engine/            # Rules, dedup, notify
│   ├── recording-service/       # FFmpeg segmenter
│   ├── camera-registry/         # Config, health, ONVIF
│   └── api-gateway/             # FastAPI + Auth
│
├── shared/
│   ├── schemas/                 # Pydantic models (camera, event, alert)
│   ├── messaging/               # Redis Streams helpers
│   ├── config/                  # Pydantic Settings
│   └── utils/                   # Geometry, image ops
│
├── models/
│   ├── weights/                 # .pt, .onnx, .engine (git-lfs)
│   └── export/                  # Export scripts (torch → onnx → trt)
│
├── dashboard/                   # React + Vite + TS
│   ├── src/
│   └── Dockerfile
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                # Test videos, expected outputs
│
├── deploy/
│   ├── kubernetes/              # K3s manifests
│   ├── ansible/                 # Edge provisioning
│   └── scripts/                 # install.sh, backup.sh
│
└── docs/
    ├── architecture.md
    ├── api.md
    ├── deployment.md
    └── model-cards/
```

---

## Immediate Next Steps (Phase 1 Start)

1. **Refactor existing `anpr.py`** into modular services (ingest → detect → track → alert)
2. **Add Redis Streams** for frame passing (replace global `latest_frame`)
3. **Implement zone config** via JSON (polygons, not just rectangles)
4. **Add BoT-SORT tracking** with track IDs persisted across frames
5. **Write unit tests** for zone logic, alert dedup
6. **Dockerize** each component

---

## Hardware Targets (Edge)

| Profile | Device | GPU | Cameras @ 1080p30 |
|---------|--------|-----|-------------------|
| Minimum | Jetson Nano / RPi 5 + Hailo-8 | 0.5-2 TOPS | 2-4 |
| Standard | Jetson Orin NX 16GB | 70 TOPS | 12-16 |
| High | Jetson Orin AGX 64GB / A2000 | 200+ TOPS | 40+ |
| Server | x86 + RTX 4070/A4000 | 300+ TOPS | 100+ |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Detection mAP (person/vehicle) | >0.85 @ IoU 0.5 |
| Tracking ID switch rate | <2% per minute |
| ANPR accuracy (clear plates) | >90% |
| Face recognition (controlled) | >95% @ FAR 0.1% |
| End-to-end latency (cam → alert) | <500ms |
| Uptime (edge, 30d) | >99.5% |
| False alert rate | <5/day/camera |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low-light performance | Phase 2 night enhancement; IR-optimized models |
| Bandwidth (remote) | Edge recording + event-only upload; H.265 + ROI |
| Model drift | Shadow inference + periodic retraining pipeline |
| Camera compatibility | ONVIF Profile S/T/G testing matrix; FFmpeg fallback |
| Scale | Horizontal worker scaling; stream ingest sharding |