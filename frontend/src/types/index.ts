export type UserRole = 'admin' | 'commander' | 'operator' | 'analyst' | 'auditor';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export type CameraStatus = 'online' | 'offline' | 'degraded';
export type CameraHealth = 'good' | 'warning' | 'critical';

export interface Camera {
  id: string;
  name: string;
  location: [number, number];
  status: CameraStatus;
  health: CameraHealth;
  fps: number;
  lastAlertAt?: string;
  streamUrl: string;
}

export type ObjectType = 'person' | 'vehicle' | 'animal' | 'unknown';

export interface Detection {
  id: string;
  type: ObjectType;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: string;
  cameraId: string;
}

export interface Track {
  id: string;
  detectionIds: string[];
  startTime: string;
  endTime?: string;
  duration: number;
}

export interface ANPRRead {
  id: string;
  plate: string;
  confidence: number;
  cameraId: string;
  timestamp: string;
  vehicleType: string;
  color: string;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'false_positive';
export type AlertType = 'intrusion' | 'loitering' | 'anpr_match' | 'camera_tamper' | 'unattended_baggage';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  cameraId: string;
  timestamp: string;
  description: string;
  confidence: number;
  riskScore: number;
}

export type IncidentStatus = 'open' | 'investigating' | 'closed';

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  alertIds: string[];
  assignedTo?: string;
  notes: string;
}

export type ZoneType = 'restricted' | 'warning' | 'safe';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  coordinates: [number, number][];
}

export interface Evidence {
  id: string;
  incidentId: string;
  type: 'video' | 'image' | 'document';
  url: string;
  capturedAt: string;
  uploadedBy: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
}

export interface EdgeNode {
  id: string;
  name: string;
  status: 'online' | 'offline';
  cpuUsage: number;
  memUsage: number;
  gpuUsage: number;
  temperature: number;
}

export interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'system' | 'alert' | 'message';
}

export interface DashboardKPIs {
  camerasTotal: number;
  camerasOnline: number;
  activeAlerts: number;
  criticalIncidents: number;
  peopleDetected: number;
  vehiclesDetected: number;
  anprReads: number;
  restrictedZoneEvents: number;
  systemHealthScore: number;
  aiProcessingFps: number;
}

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}
