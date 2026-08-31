# SIH 2026 — Master Presentation & Demonstration Guide

## Problem Statement 26187
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Category:** Software | **Theme:** Smart Automation  
**Platform:** **IBVAP** (*Intelligent Border Video Analytics Platform*)

---

## 🎯 1. 30-Second Elevator Pitch
> *"Traditional border surveillance relies on manual monitoring of dozens of CCTV streams, leading to operator fatigue, missed threats, and severe vulnerabilities during network outages. **IBVAP** transforms existing, standard IP-based CCTV cameras into an intelligent, edge-first, explainable, and resilient surveillance network without requiring expensive camera hardware replacement. We bring multi-camera tracking, ANPR, explainable AI risk scoring, and zero-data-loss offline edge synchronization to national border security."*

---

## 🏗️ 2. Core Architectural Pillars

```
+-----------------------------------------------------------------------------------+
|                                 IBVAP ARCHITECTURE                                |
+-----------------------------------------------------------------------------------+
|  [EXISTING IP CAMERAS]  -->  [LOCAL EDGE NODES]  -->  [CENTRAL COMMAND CENTER]    |
|   (RTSP / ONVIF / HTTP)       - Local YOLO / ByteTrack  - Correlation Engine      |
|                               - Local ANPR / OCR        - Incident Lifecycle      |
|                               - Explainable Risk Engine - Leaflet Geospatial Map  |
|                               - Offline Event Queue     - SHA-256 Evidence Vault  |
|                               - Bandwidth Optimizer     - Audit & RBAC Controls   |
+-----------------------------------------------------------------------------------+
```

### 1. **Camera-Agnostic Retrofit**
Works with existing RTSP/ONVIF streams; no dedicated smart cameras needed.

### 2. **Edge-First Resilience**
AI inference runs locally on Edge nodes. When network drops, events queue locally. On recovery, cryptographic deduplication synchronizes the central server automatically without data loss.

### 3. **Explainable Risk Engine (0–100)**
No black-box AI predictions. Every risk score is calculated and explained with auditable contributing factors:
- $+30$ Restricted Zone Entry
- $+20$ Prohibited Night Hours
- $+15$ Vector towards sensitive asset
- $+12$ Dwell / Loitering threshold exceeded
- $+10$ Cross-camera multi-subject correlation
- **Total: 87 / 100 — CRITICAL ALERT**

### 4. **Bandwidth Optimization (91% Reduction)**
Raw video stays at the edge; only lightweight telemetry, detections, and cryptographically signed keyframes are sent over the WAN.

### 5. **Cryptographic Evidence Vault**
Every captured incident snapshot and clip is timestamped, metadata-signed, and sealed with a SHA-256 hash for legal admissibility and chain-of-custody compliance.

---

## 🎬 3. SIH Jury Demonstration Workflow (12-Step Guided Sequence)

Access the live Presentation Mode at: **`http://localhost:5173/presentation`**

| Step | Title | On-Screen Activity | Key Talking Point for Judges |
|:---:|---|---|---|
| **1** | **Normal Surveillance** | Calm 2x2 grid, all 8 cameras online, low risk baseline | *"Baseline border condition. All existing standard CCTV feeds active."* |
| **2** | **Person Detected** | Bounding box appears on CAM-01 with tracking ID `P-104` | *"Temporal confirmation filter prevents false positives from single-frame noise."* |
| **3** | **Restricted Zone Entry** | Person crosses virtual fence boundary (Sector 4 Red Zone) | *"Visual virtual fence rules trigger immediate perimeter breach warning."* |
| **4** | **Risk Score Escalation** | Risk score increases to 87/100 (Critical) with factor breakdown | *"Explainable AI: Operators see exactly why the threat level rose."* |
| **5** | **Alert Generated** | High-priority card appears in Live Alert Feed with audio cue | *"Centralized priority queue with deduplication prevents alarm fatigue."* |
| **6** | **Cross-Camera Correlation** | Target `P-104` handed off from CAM-01 $\rightarrow$ CAM-02 $\rightarrow$ CAM-04 | *"Multi-camera event tracking without relying on invasive biometrics."* |
| **7** | **Incident Created** | Correlated incident `INC-2026-089` created with timeline | *"Multiple detection events aggregated into 1 actionable incident."* |
| **8** | **Evidence Secured** | Snapshot secured with SHA-256 hash in Evidence Vault | *"Legally verifiable chain-of-custody with tamper-evident hashing."* |
| **9** | **Network Outage Simulated** | Network status switches to **OFFLINE**; WAN disconnected | *"Simulating real-world field conditions where border connectivity drops."* |
| **10** | **Edge AI Continues** | Detection, tracking, and local alerting continue uninterrupted | *"Edge-first design: AI never stops, even during full network isolation."* |
| **11** | **Network Restored** | Network switches to **ONLINE**; sync queue activates | *"Automatic reconnection without requiring manual operator intervention."* |
| **12** | **Events Synchronized** | Pending event queue flushes cleanly to Central Server | *"Zero data loss. Complete audit trail synchronized and verified."* |

---

## 🛡️ 4. Role-Based Access Control (RBAC) Matrix

| Feature / Section | Administrator | Commander | Operator | Analyst | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| **Live Surveillance Wall** | ✅ | ✅ | ✅ | 👁️ | ❌ |
| **Alert Management** | ✅ | ✅ | ✅ | 👁️ | ❌ |
| **Incident Escalation** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Virtual Fence Editor** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ANPR Search & Intelligence** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Cross-Camera Tracking** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Analytics & Reports** | ✅ | ✅ | 👁️ | ✅ | 👁️ |
| **Evidence Vault & Hashing** | ✅ | ✅ | 👁️ | 👁️ | ✅ |
| **Audit Logs** | ✅ | 👁️ | ❌ | ❌ | ✅ |
| **System & AI Settings** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 💡 5. Anticipated Jury Questions & Defense Answers

### Q1: *"How is this different from existing CCTV smart cameras?"*
> **Answer:** Smart cameras require replacing every physical camera on the border at immense cost and vendor lock-in. IBVAP is software-defined and camera-agnostic: it sits on edge nodes next to standard, cost-effective existing IP cameras, providing centralized AI analytics, cross-camera correlation, and explainable risk scoring across the entire sector.

### Q2: *"What happens when the internet goes down at a remote outpost?"*
> **Answer:** IBVAP is edge-first. The AI model runs locally on the edge node. Detections, local alarms, and recording continue without interruption. Events are stored in a resilient local queue. Once connectivity is restored, the synchronization engine flushes events with cryptographic verification, ensuring zero data loss.

### Q3: *"How do you handle privacy and ethical AI regulations?"*
> **Answer:** By default, IBVAP uses non-biometric, appearance-based object tracking (`P-104`, `V-021`). Face detection assessment is isolated from identification. Authorized identification is strictly opt-in, requires administrative credentials, and logs every access event in the immutable audit log for legal compliance.

### Q4: *"Can your system scale to hundreds of cameras?"*
> **Answer:** Yes. Because heavy video decoding and object detection happen distributed at the edge, the central server only processes lightweight JSON event payloads and thumbnail assets. WAN bandwidth is reduced by over 90%, and the FastAPI backend utilizes async non-blocking I/O with Redis caching for massive horizontal scalability.
