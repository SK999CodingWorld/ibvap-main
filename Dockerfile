# Multi-stage production Dockerfile for IBVAP Border Surveillance Platform
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Build arguments for Vite environment configuration
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

# Install full dependencies (including devDependencies like typescript and vite)
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Python 3.11 Execution Environment
FROM python:3.11-slim
WORKDIR /app

# System dependencies for OpenCV, FFmpeg, and Image Processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1 \
    ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir ultralytics opencv-python-headless

# Copy source code
COPY . .

# Copy pre-compiled frontend distribution to backend static directory
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

ENV PORT=8000
ENV HOST=0.0.0.0
ENV DEMO_MODE=true
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "run.py"]