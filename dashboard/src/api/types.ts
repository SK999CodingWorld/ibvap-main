export interface Camera {
  id: string
  name: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
  protocol: 'rtsp' | 'http' | 'https' | 'rtmp' | 'hls' | 'ws'
  stream_url: string
  username?: string
  password?: string
  rtsp_transport: string
  enabled: boolean
  zones: string[]
  metadata: Record<string, unknown>
  ptz_enabled: boolean
  ptz_presets: PTZPreset[]
  status: 'online' | 'offline' | 'connecting' | 'error' | 'maintenance'
  last_seen?: string
  error_message?: string
  fps: number
  bitrate: number
  resolution?: string
  created_at: string
  updated_at: string
}

export interface PTZPreset {
  name: string
  pan: number
  tilt: number
  zoom: number
}

export interface CameraHealth {
  camera_id: string
  status: string
  last_frame_time?: string
  fps: number
  latency_ms: number
  error_count: number
  last_error?: string
}

export interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: BoundingBox
  track_id?: number
  metadata: Record<string, unknown>
}

export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  height: number
  center: [number, number]
}

export interface Track {
  track_id: number
  camera_id: string
  class_id: number
  class_name: string
  bbox: BoundingBox
  confidence: number
  state: 'new' | 'tracked' | 'lost' | 'removed'
  age: number
  hits: number
  hit_streak: number
  time_since_update: number
  start_time: string
  last_update: string
  zone_events: string[]
  metadata: Record<string, unknown>
}

export interface Zone {
  id: string
  config: ZoneConfig
  created_at: number
  updated_at: number
}

export interface ZoneConfig {
  type: 'polygon' | 'rectangle' | 'line' | 'circle'
  coordinates: number[][]
  name: string
  camera_id: string
  enabled: boolean
  classes: string[]
  direction?: string
  dwell_time: number
  metadata: Record<string, unknown>
}

export type AlertType =
  | 'intrusion'
  | 'line_crossing'
  | 'loitering'
  | 'dwell'
  | 'face_match'
  | 'plate_match'
  | 'anpr_detected'
  | 'face_detected'
  | 'behavior_anomaly'
  | 'camera_offline'
  | 'camera_online'
  | 'system_error'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  camera_id: string
  zone_id?: string
  track_id?: number
  type: AlertType
  severity: AlertSeverity
  message: string
  class_name?: string
  confidence?: number
  bbox?: number[]
  plate_text?: string
  face_match_id?: string
  face_distance?: number
  metadata: Record<string, unknown>
  timestamp: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

export interface AlertRule {
  id: string
  name: string
  enabled: boolean
  camera_ids: string[]
  zone_ids: string[]
  class_filters: string[]
  alert_types: AlertType[]
  min_confidence: number
  cooldown_seconds: number
  severity: AlertSeverity
  notify_webhook?: string
  notify_email: string[]
  metadata: Record<string, unknown>
}

export type EventType =
  | 'camera_connected'
  | 'camera_disconnected'
  | 'camera_error'
  | 'zone_entry'
  | 'zone_exit'
  | 'line_cross'
  | 'track_start'
  | 'track_end'
  | 'track_lost'
  | 'alert_triggered'
  | 'alert_acknowledged'
  | 'face_enrolled'
  | 'face_matched'
  | 'plate_detected'
  | 'plate_matched'
  | 'recording_start'
  | 'recording_end'
  | 'model_loaded'
  | 'model_error'

export interface Event {
  id: string
  type: EventType
  camera_id?: string
  zone_id?: string
  track_id?: number
  message: string
  data: Record<string, unknown>
  timestamp: string
  source: string
}

export interface HealthCheck {
  service: string
  version: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'starting' | 'stopping'
  uptime_seconds: number
  components: ComponentHealth[]
  timestamp: string
}

export interface ComponentHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'starting' | 'stopping'
  message?: string
  latency_ms?: number
  metadata: Record<string, unknown>
  last_check: string
}

export interface ServiceStatus {
  HEALTHY: 'healthy'
  DEGRADED: 'degraded'
  UNHEALTHY: 'unhealthy'
  STARTING: 'starting'
  STOPPING: 'stopping'
}

export interface RecordingClip {
  name: string
  path: string
  event_type?: string
  size_mb: number
  created: string
  modified: string
}

export interface StorageInfo {
  total_size_bytes: number
  total_size_mb: number
  clip_count: number
  cameras: string[]
}

export interface PTZStatus {
  pan: number
  tilt: number
  zoom: number
  moving: boolean
  error?: string
}