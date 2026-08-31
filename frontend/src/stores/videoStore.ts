import { create } from 'zustand';

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: string;
  speed: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
}

export interface PersonAttributes {
  clothingUpperColor?: string;
  clothingLowerColor?: string;
  clothingUpperType?: string;
  clothingLowerType?: string;
  hasHelmet?: boolean;
  hasBackpack?: boolean;
  hasUmbrella?: boolean;
  poseAction: string; // standing, walking, running, sitting, falling, lying, bending, climbing, jumping
  movementState: string; // stationary, moving_slow, moving_fast, loitering
}

export interface VehicleAttributes {
  vehicleType: string; // car, suv, pickup, van, truck, bus, motorcycle, scooter, bicycle, three_wheeler, emergency_vehicle, heavy_vehicle, trailer, unknown_vehicle
  plateNumber?: string;
  plateConfidence?: number;
  plateStatus?: 'CONFIRMED' | 'UNCERTAIN' | 'LOW_CONFIDENCE';
  lane?: string;
  color?: string;
}

export interface AnimalAttributes {
  species: string; // dog, cattle, horse, wild_animal, bird, unknown_animal
  isDomestic: boolean;
  threatFilterApplied: boolean;
  filterReason: string;
}

export interface BoundingBox {
  id: string;
  trackingId: string;
  type: 'PERSON' | 'VEHICLE' | 'ANIMAL' | 'OBJECT' | 'FACE';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  confidence: number;
  direction: string;
  speed: string;
  acceleration?: string;
  zone: string;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  dwellTimeSeconds?: number;
  distanceTravelledMeters?: number;
  trajectories?: TrajectoryPoint[];
  personAttrs?: PersonAttributes;
  vehicleAttrs?: VehicleAttributes;
  animalAttrs?: AnimalAttributes;
  events?: string[];
  riskScore?: number;
  riskFactors?: RiskFactor[];
  plateNumber?: string;
}

export interface OverlaySettings {
  showBoundingBoxes: boolean;
  showTrackingIds: boolean;
  showTrajectories: boolean;
  showConfidence: boolean;
  showLabels: boolean;
  showVirtualZones: boolean;
  showDirection: boolean;
  showEventMarkers: boolean;
  showRiskOverlay: boolean;
}

export interface CameraVideoConfig {
  cameraId: string;
  sourceType: 'preset' | 'file' | 'webcam' | 'url';
  sourceUrl: string;
  fileName?: string;
  isWebcam?: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  playbackRate: number;
  showAiOverlays: boolean;
  showZoneOverlays: boolean;
  overlays: OverlaySettings;
  detections: BoundingBox[];
}

export interface EvidenceItem {
  id: string;
  type: 'Snapshot' | 'Video Clip' | 'Metadata';
  camera: string;
  incident: string | null;
  time: string;
  hash: string;
  status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  imageUrl?: string;
  metadata?: any;
}

// Built-in high-quality demo video presets
export const PRESET_VIDEOS = [
  {
    id: 'preset-thermal',
    name: 'Sector 4 Perimeter Breach (Thermal Night Watch)',
    description: 'High-contrast thermal surveillance stream with perimeter breach and night movement',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Thermal IR',
    defaultCamera: 'BOP-01',
    defaultDetections: [
      {
        id: 'd1',
        trackingId: 'P-104',
        type: 'PERSON' as const,
        x: 28,
        y: 35,
        width: 16,
        height: 42,
        confidence: 96.4,
        direction: 'NORTH-EAST',
        speed: '1.4 m/s',
        acceleration: '+0.05 m/s²',
        zone: 'Sector 4 Restricted Alpha',
        alertLevel: 'critical' as const,
        dwellTimeSeconds: 142,
        distanceTravelledMeters: 34.5,
        personAttrs: {
          clothingUpperColor: 'Navy Blue / Olive',
          clothingLowerColor: 'Black Trousers',
          clothingUpperType: 'Tactical Jacket',
          clothingLowerType: 'Trousers',
          hasHelmet: false,
          hasBackpack: true,
          hasUmbrella: false,
          poseAction: 'walking',
          movementState: 'loitering'
        },
        events: ['ZONE_ENTRY', 'LOITERING', 'DIRECTION_VIOLATION'],
        riskScore: 87,
        riskFactors: [
          { factor: 'Restricted Zone Entry', weight: 30 },
          { factor: 'Prohibited Night Hours', weight: 20 },
          { factor: 'Vector towards Sensitive Fence', weight: 15 },
          { factor: 'Dwell time > 120s (Loitering)', weight: 12 },
          { factor: 'Carrying Backpack Payload', weight: 10 }
        ],
        trajectories: [
          { x: 18, y: 50, timestamp: '09:30:10', speed: '1.2 m/s' },
          { x: 22, y: 44, timestamp: '09:30:40', speed: '1.3 m/s' },
          { x: 25, y: 38, timestamp: '09:31:10', speed: '1.4 m/s' },
          { x: 28, y: 35, timestamp: '09:31:40', speed: '1.4 m/s' }
        ]
      },
      {
        id: 'd-a02',
        trackingId: 'A-002',
        type: 'ANIMAL' as const,
        x: 72,
        y: 60,
        width: 14,
        height: 18,
        confidence: 92.1,
        direction: 'EAST',
        speed: '0.8 m/s',
        zone: 'Sector 4 Outer Buffer',
        alertLevel: 'low' as const,
        dwellTimeSeconds: 45,
        animalAttrs: {
          species: 'wild_animal',
          isDomestic: false,
          threatFilterApplied: true,
          filterReason: 'Not classified as human intrusion - Filtered to Low Risk'
        },
        events: ['ANIMAL_DETECTED', 'FILTER_BYPASSED'],
        riskScore: 12,
        riskFactors: [
          { factor: 'Non-human Biological Signature', weight: -50 },
          { factor: 'Outer Buffer Zone', weight: 10 }
        ],
        trajectories: [
          { x: 65, y: 62, timestamp: '09:31:00', speed: '0.7 m/s' },
          { x: 72, y: 60, timestamp: '09:31:30', speed: '0.8 m/s' }
        ]
      }
    ]
  },
  {
    id: 'preset-checkpoint',
    name: 'Highway Checkpoint & ANPR Stream',
    description: 'Vehicle approach corridor with license plate scanning and vehicle classification',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'ANPR / Vehicle',
    defaultCamera: 'CHECK-01',
    defaultDetections: [
      {
        id: 'd2',
        trackingId: 'V-021',
        type: 'VEHICLE' as const,
        x: 38,
        y: 42,
        width: 28,
        height: 34,
        confidence: 98.2,
        direction: 'SOUTH',
        speed: '34 km/h',
        acceleration: '-1.2 m/s²',
        zone: 'Highway Checkpoint Lane 1',
        alertLevel: 'medium' as const,
        plateNumber: 'DL 01 AB 1234',
        dwellTimeSeconds: 18,
        distanceTravelledMeters: 120,
        vehicleAttrs: {
          vehicleType: 'suv',
          plateNumber: 'DL 01 AB 1234',
          plateConfidence: 97.8,
          plateStatus: 'CONFIRMED' as const,
          lane: 'Lane 1 (Inbound)',
          color: 'Silver Metallic'
        },
        events: ['VEHICLE_DETECTED', 'ANPR_DETECTED', 'SPEED_MONITORED'],
        riskScore: 38,
        riskFactors: [
          { factor: 'Approaching Security Checkpoint', weight: 20 },
          { factor: 'Deceleration to Inspection Speed', weight: 10 },
          { factor: 'Registered Commercial Vehicle', weight: 8 }
        ],
        trajectories: [
          { x: 38, y: 15, timestamp: '09:31:00', speed: '45 km/h' },
          { x: 38, y: 28, timestamp: '09:31:20', speed: '38 km/h' },
          { x: 38, y: 42, timestamp: '09:31:40', speed: '34 km/h' }
        ]
      }
    ]
  },
  {
    id: 'preset-drone',
    name: 'Border Outpost Aerial FOV (Drone Feed)',
    description: 'Elevated wide-angle surveillance monitoring multiple active boundary zones',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    category: 'Drone / Aerial',
    defaultCamera: 'ROAD-01',
    defaultDetections: [
      {
        id: 'd3',
        trackingId: 'V-044',
        type: 'VEHICLE' as const,
        x: 55,
        y: 48,
        width: 22,
        height: 26,
        confidence: 94.1,
        direction: 'WEST',
        speed: '45 km/h',
        zone: 'Approach Rd N',
        alertLevel: 'low' as const,
        vehicleAttrs: {
          vehicleType: 'truck',
          plateNumber: 'MH 14 CC 9876',
          plateConfidence: 92.4,
          plateStatus: 'CONFIRMED' as const,
          lane: 'Main Approach Road',
          color: 'White'
        },
        events: ['VEHICLE_DETECTED'],
        riskScore: 22,
        riskFactors: [{ factor: 'Nominal Highway Corridor Transit', weight: 22 }]
      }
    ]
  },
  {
    id: 'preset-perimeter',
    name: 'Restricted Zone Perimeter Fence',
    description: 'Fixed boundary camera monitoring virtual tripwire and loitering subjects',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    category: 'Perimeter',
    defaultCamera: 'BOP-02',
    defaultDetections: [
      {
        id: 'd4',
        trackingId: 'P-098',
        type: 'PERSON' as const,
        x: 62,
        y: 38,
        width: 14,
        height: 38,
        confidence: 91.8,
        direction: 'NORTH',
        speed: '0.8 m/s',
        zone: 'Sector 4 Buffer Zone',
        alertLevel: 'high' as const,
        dwellTimeSeconds: 95,
        personAttrs: {
          clothingUpperColor: 'Grey Hoodie',
          clothingLowerColor: 'Blue Jeans',
          clothingUpperType: 'Hoodie',
          clothingLowerType: 'Jeans',
          hasHelmet: false,
          hasBackpack: false,
          hasUmbrella: false,
          poseAction: 'walking',
          movementState: 'moving_slow'
        },
        events: ['ZONE_ENTRY'],
        riskScore: 68,
        riskFactors: [
          { factor: 'Buffer Zone Trespass', weight: 40 },
          { factor: 'Non-Standard Movement Vector', weight: 28 }
        ]
      }
    ]
  }
];

const DEFAULT_OVERLAYS: OverlaySettings = {
  showBoundingBoxes: true,
  showTrackingIds: true,
  showTrajectories: true,
  showConfidence: true,
  showLabels: true,
  showVirtualZones: true,
  showDirection: true,
  showEventMarkers: true,
  showRiskOverlay: true
};

interface VideoStoreState {
  cameraConfigs: Record<string, CameraVideoConfig>;
  evidenceList: EvidenceItem[];
  inspectingCameraId: string | null;
  inspectedObject: BoundingBox | null;
  videoModalOpen: boolean;
  selectedCameraForModal: string;
  globalOverlays: OverlaySettings;
  
  // Actions
  setVideoSource: (cameraId: string, sourceType: 'preset' | 'file' | 'webcam' | 'url', sourceUrl: string, fileName?: string) => void;
  togglePlay: (cameraId: string) => void;
  toggleMute: (cameraId: string) => void;
  toggleAiOverlays: (cameraId: string) => void;
  toggleZoneOverlays: (cameraId: string) => void;
  setPlaybackRate: (cameraId: string, rate: number) => void;
  setCameraOverlay: (cameraId: string, key: keyof OverlaySettings, value: boolean) => void;
  setGlobalOverlay: (key: keyof OverlaySettings, value: boolean) => void;
  addEvidence: (evidence: EvidenceItem) => void;
  openVideoModal: (cameraId: string) => void;
  closeVideoModal: () => void;
  openInspection: (cameraId: string) => void;
  closeInspection: () => void;
  inspectObject: (object: BoundingBox | null) => void;
}

const DEFAULT_CONFIGS: Record<string, CameraVideoConfig> = {
  'BOP-01': {
    cameraId: 'BOP-01',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[0].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: PRESET_VIDEOS[0].defaultDetections
  },
  'BOP-02': {
    cameraId: 'BOP-02',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[3].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: PRESET_VIDEOS[3].defaultDetections
  },
  'BOP-03': {
    cameraId: 'BOP-03',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[0].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: [
      {
        id: 'd5',
        trackingId: 'P-109',
        type: 'PERSON',
        x: 42,
        y: 40,
        width: 15,
        height: 38,
        confidence: 89.5,
        direction: 'WEST',
        speed: '1.1 m/s',
        zone: 'Perimeter W',
        alertLevel: 'low',
        dwellTimeSeconds: 30,
        personAttrs: {
          poseAction: 'standing',
          movementState: 'stationary',
          clothingUpperColor: 'Brown',
          clothingLowerColor: 'Khaki'
        },
        riskScore: 25,
        riskFactors: [{ factor: 'Perimeter Proximity', weight: 25 }]
      }
    ]
  },
  'CHECK-01': {
    cameraId: 'CHECK-01',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[1].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: PRESET_VIDEOS[1].defaultDetections
  },
  'ROAD-01': {
    cameraId: 'ROAD-01',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[2].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: PRESET_VIDEOS[2].defaultDetections
  },
  'ROAD-02': {
    cameraId: 'ROAD-02',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[1].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: false,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: []
  },
  'GATE-01': {
    cameraId: 'GATE-01',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[2].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: []
  },
  'WATCH-01': {
    cameraId: 'WATCH-01',
    sourceType: 'preset',
    sourceUrl: PRESET_VIDEOS[3].url,
    isPlaying: true,
    isMuted: true,
    playbackRate: 1.0,
    showAiOverlays: true,
    showZoneOverlays: true,
    overlays: { ...DEFAULT_OVERLAYS },
    detections: []
  }
};

export const useVideoStore = create<VideoStoreState>((set) => ({
  cameraConfigs: DEFAULT_CONFIGS,
  evidenceList: [
    { id: 'EVD-001', type: 'Video Clip', camera: 'BOP-01', incident: 'INC-001', time: '2026-08-25 10:15:22', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', status: 'VERIFIED' },
    { id: 'EVD-002', type: 'Snapshot', camera: 'CHECK-01', incident: 'INC-001', time: '2026-08-25 10:16:05', hash: '8a2b5342a8fc1c149afbf4c8996fb92491a3e5c7d8b2f4a6c8e0d2b4f6a8c0e2', status: 'VERIFIED' }
  ],
  inspectingCameraId: null,
  inspectedObject: null,
  videoModalOpen: false,
  selectedCameraForModal: 'BOP-01',
  globalOverlays: { ...DEFAULT_OVERLAYS },

  setVideoSource: (cameraId, sourceType, sourceUrl, fileName) => set((state) => {
    const prev = state.cameraConfigs[cameraId] || {
      cameraId,
      sourceType: 'preset',
      sourceUrl: '',
      isPlaying: true,
      isMuted: true,
      playbackRate: 1.0,
      showAiOverlays: true,
      showZoneOverlays: true,
      overlays: { ...DEFAULT_OVERLAYS },
      detections: []
    };

    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: {
          ...prev,
          sourceType,
          sourceUrl,
          fileName,
          isPlaying: true,
          isWebcam: sourceType === 'webcam'
        }
      }
    };
  }),

  togglePlay: (cameraId) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: { ...config, isPlaying: !config.isPlaying }
      }
    };
  }),

  toggleMute: (cameraId) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: { ...config, isMuted: !config.isMuted }
      }
    };
  }),

  toggleAiOverlays: (cameraId) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    const nextVal = !config.showAiOverlays;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: { 
          ...config, 
          showAiOverlays: nextVal,
          overlays: { ...config.overlays, showBoundingBoxes: nextVal }
        }
      }
    };
  }),

  toggleZoneOverlays: (cameraId) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    const nextVal = !config.showZoneOverlays;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: { 
          ...config, 
          showZoneOverlays: nextVal,
          overlays: { ...config.overlays, showVirtualZones: nextVal }
        }
      }
    };
  }),

  setPlaybackRate: (cameraId, rate) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: { ...config, playbackRate: rate }
      }
    };
  }),

  setCameraOverlay: (cameraId, key, value) => set((state) => {
    const config = state.cameraConfigs[cameraId];
    if (!config) return state;
    return {
      cameraConfigs: {
        ...state.cameraConfigs,
        [cameraId]: {
          ...config,
          overlays: { ...config.overlays, [key]: value }
        }
      }
    };
  }),

  setGlobalOverlay: (key, value) => set((state) => {
    const nextGlobal = { ...state.globalOverlays, [key]: value };
    const nextConfigs: Record<string, CameraVideoConfig> = {};
    for (const [id, config] of Object.entries(state.cameraConfigs)) {
      nextConfigs[id] = {
        ...config,
        overlays: { ...config.overlays, [key]: value }
      };
    }
    return { globalOverlays: nextGlobal, cameraConfigs: nextConfigs };
  }),

  addEvidence: (item) => set((state) => ({
    evidenceList: [item, ...state.evidenceList]
  })),

  openVideoModal: (cameraId) => set({
    videoModalOpen: true,
    selectedCameraForModal: cameraId
  }),

  closeVideoModal: () => set({ videoModalOpen: false }),

  openInspection: (cameraId) => set({ inspectingCameraId: cameraId }),
  closeInspection: () => set({ inspectingCameraId: null }),
  inspectObject: (object) => set({ inspectedObject: object })
}));
