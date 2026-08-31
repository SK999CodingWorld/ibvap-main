import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import { 
  X, Camera, Play, Pause, Volume2, VolumeX, Shield, AlertTriangle, 
  Car, Eye, Download, CheckCircle, Crosshair, MapPin, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Utility to generate a pseudo-SHA256 for browser demonstration
async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const VideoInspectionModal: React.FC = () => {
  const { inspectingCameraId, closeInspection, cameraConfigs, togglePlay, toggleMute, toggleAiOverlays, toggleZoneOverlays, setPlaybackRate, addEvidence } = useVideoStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapshotToast, setSnapshotToast] = useState<{ id: string; hash: string } | null>(null);
  const [alertFired, setAlertFired] = useState(false);
  const [targetBoxes, setTargetBoxes] = useState<any[]>([]);

  const config = inspectingCameraId ? cameraConfigs[inspectingCameraId] : null;

  // Initialize targets
  useEffect(() => {
    if (config?.detections) {
      setTargetBoxes(config.detections);
    }
  }, [config]);

  // Subtle target movement simulation over time
  useEffect(() => {
    if (!config?.isPlaying) return;
    const interval = setInterval(() => {
      setTargetBoxes(prev => prev.map(box => ({
        ...box,
        x: Math.max(10, Math.min(80, box.x + (Math.random() * 2 - 1))),
        y: Math.max(15, Math.min(75, box.y + (Math.random() * 1.5 - 0.75))),
      })));
    }, 800);
    return () => clearInterval(interval);
  }, [config?.isPlaying]);

  if (!inspectingCameraId || !config) return null;

  const handleCaptureSnapshot = async () => {
    const video = videoRef.current;
    let dataUrl = '';
    
    if (video) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        // Fallback if cross-origin video restrictions apply
        dataUrl = 'placeholder';
      }
    }

    const evdId = `EVD-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = await computeSha256(evdId + inspectingCameraId);

    const newEvidence = {
      id: evdId,
      type: 'Snapshot' as const,
      camera: inspectingCameraId,
      incident: alertFired ? 'INC-089' : null,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hash,
      status: 'VERIFIED' as const,
      imageUrl: dataUrl
    };

    addEvidence(newEvidence);
    setSnapshotToast({ id: evdId, hash });
    setTimeout(() => setSnapshotToast(null), 4000);
  };

  const handleTriggerAlert = () => {
    setAlertFired(true);
    setTimeout(() => setAlertFired(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                {inspectingCameraId} — High-Precision Tactical Stream
              </h2>
              <p className="text-xs text-slate-400">
                Source: {config.fileName || config.sourceUrl || "Simulated Feed"} · 1080p @ 30 FPS · Latency: 24ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              onClick={handleCaptureSnapshot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 font-semibold"
            >
              <Camera size={14} /> Capture Evidence Snapshot
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleTriggerAlert}
              className="flex items-center gap-1.5 font-semibold"
            >
              <AlertTriangle size={14} /> Trigger Threat Alert
            </Button>
            <button 
              onClick={closeInspection}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area: Video + Telemetry Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left / Center: Video Stream with Overlays */}
          <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
            {config.sourceUrl ? (
              <video
                ref={videoRef}
                src={config.sourceUrl}
                autoPlay={config.isPlaying}
                loop
                muted={config.isMuted}
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-600 font-mono text-sm flex flex-col items-center">
                <Crosshair className="w-12 h-12 mb-2 text-cyan-500 animate-spin" />
                AWAITING VIDEO STREAM
              </div>
            )}

            {/* Virtual Fence Polygon Overlay */}
            {config.showZoneOverlays && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
                <polygon 
                  points="150,80 520,60 480,380 100,340" 
                  className="fill-red-500/10 stroke-red-500 stroke-2 stroke-dasharray-4"
                />
                <text x="160" y="110" fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  RESTRICTED ZONE ALPHA (BOUNDARY)
                </text>
              </svg>
            )}

            {/* Dynamic AI Detection Bounding Boxes */}
            {config.showAiOverlays && targetBoxes.map((box) => (
              <div
                key={box.id}
                className="absolute border-2 border-red-500 bg-red-500/15 transition-all duration-700 pointer-events-none z-20"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`
                }}
              >
                {/* Target Tag */}
                <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 whitespace-nowrap">
                  <span>{box.type}: {box.trackingId}</span>
                  <span className="opacity-75">({box.confidence}%)</span>
                </div>

                {/* Sub-label details */}
                <div className="absolute -bottom-5 left-0 text-[9px] font-mono bg-black/80 text-cyan-300 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {box.speed} · {box.direction}
                </div>
              </div>
            ))}

            {/* Alert Pulse Ring */}
            {alertFired && (
              <div className="absolute inset-0 border-4 border-red-500 animate-ping pointer-events-none z-30" />
            )}

            {/* HUD Status Overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 font-mono text-xs text-emerald-400 bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-emerald-500/20 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white font-bold">REC // {inspectingCameraId}</span>
              </div>
              <div className="text-[11px] text-slate-300">STREAM PROTOCOL: H.264 / RTSP OVER WSS</div>
              <div className="text-[11px] text-cyan-400">TRACKED TARGETS: {targetBoxes.length} CONFIRMED</div>
            </div>

            {/* Video Controls Bar at bottom */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlay(inspectingCameraId)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  {config.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => toggleMute(inspectingCameraId)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  {config.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg p-1">
                  {[0.5, 1.0, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(inspectingCameraId, rate);
                        if (videoRef.current) videoRef.current.playbackRate = rate;
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        config.playbackRate === rate ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAiOverlays(inspectingCameraId)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 ${
                    config.showAiOverlays 
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Eye size={14} /> AI Bounding Boxes
                </button>

                <button
                  onClick={() => toggleZoneOverlays(inspectingCameraId)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 ${
                    config.showZoneOverlays 
                      ? 'bg-red-500/20 border-red-500 text-red-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Shield size={14} /> Virtual Fences
                </button>
              </div>
            </div>

            {/* Snapshot Toast */}
            {snapshotToast && (
              <div className="absolute top-6 right-6 z-40 bg-slate-900 border border-emerald-500 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-300 max-w-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                  <CheckCircle size={18} />
                  <span>Snapshot Saved to Evidence Vault</span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  ID: <span className="text-cyan-400">{snapshotToast.id}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  SHA-256: {snapshotToast.hash}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Real-time Telemetry & AI Target Intelligence */}
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto space-y-4 text-xs font-mono">
            
            {/* Target Stream Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans border-b border-slate-800 pb-2">
                <Crosshair className="text-cyan-400 w-4 h-4" />
                Active Target Intelligence
              </h3>

              {targetBoxes.map((box) => (
                <div key={box.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold">{box.trackingId}</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">
                      {box.alertLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                    <div>Class: <span className="text-white">{box.type}</span></div>
                    <div>Confidence: <span className="text-emerald-400">{box.confidence}%</span></div>
                    <div>Speed: <span className="text-white">{box.speed}</span></div>
                    <div>Vector: <span className="text-white">{box.direction}</span></div>
                  </div>
                  {box.plateNumber && (
                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-amber-300">
                      <span className="text-[10px]">PLATE READ:</span>
                      <span className="bg-black px-1.5 py-0.5 rounded border border-amber-500/30">{box.plateNumber}</span>
                    </div>
                  )}
                </div>
              ))}

              {targetBoxes.length === 0 && (
                <div className="text-slate-500 text-center py-6">
                  No active high-threat objects in FOV.
                </div>
              )}
            </div>

            {/* Edge AI Metrics */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-200 font-sans flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-400" />
                Edge Inference Pipeline
              </h4>
              <div className="space-y-1.5 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>YOLO Detection:</span>
                  <span className="text-emerald-400">18.4 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>ByteTrack Handoff:</span>
                  <span className="text-emerald-400">4.2 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Temporal Voting:</span>
                  <span className="text-cyan-400">CONFIRMED</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Score:</span>
                  <span className="text-amber-400 font-bold">87 / 100</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
