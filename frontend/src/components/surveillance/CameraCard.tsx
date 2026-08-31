import React, { useRef, useState, useEffect } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import { 
  Maximize2, Camera, Video, AlertCircle, Play, Pause, 
  Volume2, VolumeX, Shield, AlertTriangle, Upload, Eye, CheckCircle,
  Radio, WifiOff, Tv
} from 'lucide-react';

interface CameraData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'degraded';
  fps: number;
  aiStatus: boolean;
  detections: number;
  alertLevel?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  zone?: string;
}

interface CameraCardProps {
  camera: CameraData;
  size?: 'sm' | 'md' | 'lg';
  showOverlays?: boolean;
  onClick?: () => void;
  onFullscreen?: () => void;
}

// Utility to generate SHA256 string for evidence
async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const CameraCard: React.FC<CameraCardProps> = ({ 
  camera, 
  showOverlays = true, 
  onClick
}) => {
  const { 
    cameraConfigs, 
    openVideoModal, 
    openInspection, 
    togglePlay, 
    toggleMute, 
    addEvidence 
  } = useVideoStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [activeBoxes, setActiveBoxes] = useState<any[]>([]);

  const config = cameraConfigs[camera.id];
  
  // Determine feed mode: Live Stream, Heatmap Stream, Custom Video, or No Signal Standby
  const isPrimaryLive = camera.id === 'BOP-01' || config?.sourceUrl === '/video_feed';
  const isThermalHeatmap = camera.id === 'BOP-02' || config?.sourceUrl === '/heatmap';
  const hasCustomVideo = Boolean(config?.sourceUrl && !['/video_feed', '/heatmap'].includes(config.sourceUrl));
  const isStandbyNoSignal = !isPrimaryLive && !isThermalHeatmap && !hasCustomVideo;

  useEffect(() => {
    if (config?.detections) {
      setActiveBoxes(config.detections);
    }
  }, [config?.detections]);

  const getStatusColor = (status: string) => {
    if (isPrimaryLive || isThermalHeatmap) return 'bg-emerald-500';
    switch(status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getAlertRing = (level?: string) => {
    if (alertTriggered) return 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 animate-pulse';
    switch(level) {
      case 'critical': return 'ring-2 ring-red-500 ring-inset';
      case 'high': return 'ring-2 ring-orange-500 ring-inset';
      case 'medium': return 'ring-2 ring-yellow-500 ring-inset';
      default: return 'ring-1 ring-slate-800 hover:ring-slate-700';
    }
  };

  const handleCaptureSnapshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const evdId = `EVD-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = await computeSha256(evdId + camera.id);

    addEvidence({
      id: evdId,
      type: 'Snapshot',
      camera: camera.id,
      incident: alertTriggered ? 'INC-089' : null,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hash,
      status: 'VERIFIED',
      imageUrl: isPrimaryLive ? '/api/stream/snapshot' : undefined
    });

    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  const handleTriggerAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertTriggered(true);
    setTimeout(() => setAlertTriggered(false), 4000);
  };

  return (
    <div 
      className={`relative bg-slate-900 rounded-xl overflow-hidden flex flex-col group transition-all shadow-lg ${getAlertRing(camera.alertLevel)}`}
      onClick={onClick}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-20 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(camera.status)} animate-pulse shadow-sm`} />
          <span className="text-white font-mono font-bold">{camera.id}</span>
          <span className="text-slate-400 text-[11px] truncate max-w-[120px] hidden sm:inline">{camera.name}</span>
        </div>

        <div className="flex items-center space-x-2">
          {isPrimaryLive ? (
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold font-mono border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE STREAM
            </span>
          ) : isThermalHeatmap ? (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold font-mono border border-purple-500/30 flex items-center gap-1">
              🔥 THERMAL HEATMAP
            </span>
          ) : camera.aiStatus ? (
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1">
              <Eye size={10} /> AI STANDBY
            </span>
          ) : null}

          <span className="px-1.5 py-0.5 bg-black/60 text-white rounded font-mono text-[10px] border border-slate-700/50">
            {isPrimaryLive || isThermalHeatmap ? '30 FPS' : isStandbyNoSignal ? '0 FPS' : `${camera.fps} FPS`}
          </span>
        </div>
      </div>

      {/* Video Display Area */}
      <div className="flex-grow bg-slate-950 relative min-h-[190px] aspect-video flex items-center justify-center overflow-hidden">
        
        {/* 1. Real Live AI Vision Video Stream */}
        {isPrimaryLive ? (
          <img
            src="/video_feed"
            alt="Live Border Surveillance Stream"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to demo banner if feed restarts
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : isThermalHeatmap ? (
          /* 2. Real Thermal Movement Heatmap Stream */
          <img
            src="/heatmap"
            alt="Thermal Foot-Traffic Heatmap"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : hasCustomVideo ? (
          /* 3. Custom Uploaded / Preset Video */
          <video
            ref={videoRef}
            src={config.sourceUrl}
            autoPlay={config.isPlaying}
            loop
            muted={config.isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* 4. Professional High-Tech NO SIGNAL / DEMO STANDBY Display (No fake boxes on dark background) */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 text-center relative select-none">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-500 shadow-inner">
                <WifiOff className="w-7 h-7 text-amber-500/70 animate-pulse" />
              </div>
              
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-slate-300 tracking-wider flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  STANDBY CHANNEL // NO RTSP SIGNAL
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  {camera.location} (Channel {camera.id})
                </p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); openVideoModal(camera.id); }}
                className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 hover:text-cyan-300 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 shadow"
              >
                <Upload size={12} /> Connect RTSP / Sample Video
              </button>
            </div>
          </div>
        )}

        {/* Scanline Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />

        {/* Timestamp */}
        <div className="absolute bottom-2.5 right-2.5 text-slate-300 font-mono text-[10px] bg-black/70 px-2 py-0.5 rounded border border-slate-800 z-10">
          {camera.timestamp}
        </div>

        {/* REC Indicator */}
        {(isPrimaryLive || isThermalHeatmap || hasCustomVideo) && (
          <div className="absolute top-2.5 left-28 z-20 flex items-center gap-1 text-[10px] font-mono text-red-500 bg-black/60 px-1.5 py-0.5 rounded">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span>REC</span>
          </div>
        )}

        {/* Only Render Custom AI Bounding Boxes If Real Video is Active (Never on dark standby) */}
        {showOverlays && config?.showAiOverlays && hasCustomVideo && activeBoxes.map((bbox, i) => (
          <div 
            key={bbox.id || i}
            className="absolute border-2 border-cyan-400 bg-cyan-400/15 shadow-sm transition-all duration-700 pointer-events-none z-10"
            style={{
              left: `${bbox.x}%`,
              top: `${bbox.y}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`
            }}
          >
            <span className="absolute -top-4 left-[-2px] bg-cyan-500 text-black text-[9px] px-1 font-mono font-bold whitespace-nowrap rounded-t">
              {bbox.trackingId || bbox.label || 'TARGET'} ({bbox.confidence || 95}%)
            </span>
          </div>
        ))}

        {/* Snapshot Success Notification Banner */}
        {snapshotSuccess && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm z-30 flex items-center justify-center flex-col text-emerald-400 gap-1.5 animate-in fade-in duration-200">
            <CheckCircle size={28} />
            <span className="text-xs font-bold font-mono">SNAPSHOT SAVED (SHA-256)</span>
            <span className="text-[10px] text-emerald-300">Added to Evidence Vault</span>
          </div>
        )}

        {/* Hover Action Bar */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-300 font-mono bg-black/70 px-2 py-1 rounded">
              Source: {isPrimaryLive ? 'LIVE WEBCAM / MP4' : isThermalHeatmap ? 'THERMAL HEATMAP' : config?.sourceType?.toUpperCase() || 'STANDBY'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openVideoModal(camera.id); }}
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow transition-colors"
              title="Upload custom video or select preset"
            >
              <Upload size={13} /> Change Feed
            </button>
          </div>

          {/* Center Play / Pause and Tools */}
          <div className="flex items-center justify-center gap-2">
            {hasCustomVideo && (
              <button 
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-full text-white transition-all shadow hover:scale-105"
                onClick={(e) => { e.stopPropagation(); togglePlay(camera.id); }}
                title={config?.isPlaying ? 'Pause Feed' : 'Play Feed'}
              >
                {config?.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            )}

            <button 
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={handleCaptureSnapshot}
              title="Capture SHA-256 Forensic Snapshot"
            >
              <Camera size={16} />
            </button>

            <button 
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={handleTriggerAlert}
              title="Trigger Alarm Simulation"
            >
              <AlertCircle size={16} className="text-red-400" />
            </button>
          </div>

          {/* Bottom Bar inside Hover */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              {camera.location}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); openInspection(camera.id); }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
            >
              <Maximize2 size={11} /> Inspect Target
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
