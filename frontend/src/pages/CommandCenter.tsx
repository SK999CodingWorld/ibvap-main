import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { 
  Camera, AlertTriangle, Users, CarFront, Shield, 
  Activity, BarChart3, AlertCircle, Bell, HeartPulse,
  Monitor, Wifi, Cpu, TrendingUp, TrendingDown, Minus,
  MapPin, Clock, Eye, Video, CheckCircle2, Flame, RefreshCw, Upload,
  Maximize2, Radio, Layers
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { VideoSourceModal } from '@/components/surveillance/VideoSourceModal';
import { VideoInspectionModal } from '@/components/surveillance/VideoInspectionModal';
import { ObjectInspectorModal } from '@/components/surveillance/ObjectInspectorModal';
import { ZoneSetupModal } from '@/components/surveillance/ZoneSetupModal';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/Button';

// ── Mock KPI Data ──────────────────────────────────────────────────────────
const kpis = [
  { label: 'Cameras Online', value: '8 / 8', icon: Camera, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'up' as const, change: '100%' },
  { label: 'Active Targets Tracked', value: '14 Active', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: 'up' as const, change: 'ByteTrack' },
  { label: 'Critical Threat Score', value: '87 / 100', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', trend: 'up' as const, change: 'CRITICAL' },
  { label: 'Bandwidth Optimization', value: '91.4%', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: 'up' as const, change: 'Edge Filtered' },
  { label: 'ANPR Reads (24h)', value: 89, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: 'up' as const, change: '+12' },
  { label: 'System Health', value: '98%', icon: HeartPulse, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'flat' as const, change: 'Optimal' },
];

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  camera: string;
  location: string;
  time: string;
  confidence: number | string;
  riskScore: number;
  object: string;
  trackingId: string | number;
}

const INITIAL_ALERTS: AlertItem[] = [
  { id: 'ALT-0047', severity: 'critical', type: 'Restricted Zone Intrusion', camera: 'BOP-01', location: 'Sector 4 Red Zone Alpha', time: new Date().toLocaleTimeString(), confidence: '96.4%', riskScore: 87, object: 'PERSON', trackingId: '104' },
  { id: 'ALT-0046', severity: 'medium', type: 'Checkpoint Approach', camera: 'CHECK-01', location: 'Highway 1 Access Lane', time: new Date(Date.now() - 180000).toLocaleTimeString(), confidence: '98.2%', riskScore: 38, object: 'VEHICLE', trackingId: '21' },
  { id: 'ALT-0045', severity: 'low', type: 'Animal Movement (Filtered)', camera: 'BOP-01', location: 'Sector 4 Buffer Zone', time: new Date(Date.now() - 600000).toLocaleTimeString(), confidence: '92.1%', riskScore: 12, object: 'ANIMAL', trackingId: '02' },
];

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [streamHealthy, setStreamHealthy] = useState(true);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('BOP-01 (Primary Tracking Feed)');
  const [activeTracksCount, setActiveTracksCount] = useState(13);
  const [evidenceCount, setEvidenceCount] = useState(452);
  const [anprCount, setAnprCount] = useState(89);
  const [maxThreatScore, setMaxThreatScore] = useState(87);
  const [fps, setFps] = useState(30.0);
  const alertsEndRef = useRef<HTMLDivElement>(null);
  const { openVideoModal, openInspection } = useVideoStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll live telemetry from all backend engines
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        // 1. Tracking stats
        const trkRes = await fetch('/api/tracks/stats');
        if (trkRes.ok) {
          const d = await trkRes.json();
          if (d.stats?.active_tracks && isMounted) setActiveTracksCount(d.stats.active_tracks);
        }
        // 2. Evidence stats
        const evRes = await fetch('/api/evidence/stats');
        if (evRes.ok) {
          const d = await evRes.json();
          if (d.total_cases && isMounted) setEvidenceCount(d.total_cases);
        }
        // 3. Performance FPS
        const perfRes = await fetch('/api/stream/performance');
        if (perfRes.ok) {
          const d = await perfRes.json();
          if (d.fps && isMounted) setFps(d.fps);
        }
        // 4. Alerts & max threat score
        const altRes = await fetch('/api/stream/alerts');
        if (altRes.ok) {
          const alertsData = await altRes.json();
          if (Array.isArray(alertsData) && alertsData.length > 0 && isMounted) {
            const formatted: AlertItem[] = alertsData.slice(0, 25).map((a, i) => ({
              id: `ALT-${8000 + i}`,
              severity: a.severity?.toLowerCase() || (a.type?.includes('Person') ? 'critical' : 'high'),
              type: a.type || 'Zone Intrusion',
              camera: 'BOP-01',
              location: a.zone || 'Sector 4 Restricted Alpha',
              time: a.time || new Date().toLocaleTimeString(),
              confidence: typeof a.confidence === 'number' ? `${a.confidence.toFixed(1)}%` : `${a.confidence}%`,
              riskScore: a.score || (a.severity === 'CRITICAL' ? 88 : 65),
              object: a.object_type?.toUpperCase() || 'TARGET',
              trackingId: a.track_id || a.type?.match(/ID #(\d+)/)?.[1] || '104'
            }));
            setLiveAlerts(formatted);
            const highestScore = Math.max(...alertsData.map((a: any) => a.score || 0), 75);
            setMaxThreatScore(highestScore);
          }
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const kpis = [
    { label: 'Cameras Online', value: '8 / 8 Online', icon: Camera, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: 'Surveillance Wall →', link: '/surveillance' },
    { label: 'Active Targets Tracked', value: `${activeTracksCount} In-Frame`, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', change: 'Detection Feed →', link: '/tracking' },
    { label: 'Critical Threat Score', value: `${maxThreatScore} / 100`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', change: 'Alert Audit →', link: '/alerts' },
    { label: 'Evidence Case Vault', value: `${evidenceCount} Cases`, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', change: 'Browse Vault →', link: '/evidence' },
    { label: 'ANPR Reads (24h)', value: `${anprCount} Vehicles`, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', change: 'Plate Logs →', link: '/anpr' },
    { label: 'AI Inference Rate', value: `${fps.toFixed(1)} FPS`, icon: HeartPulse, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: 'Model Center →', link: '/ai-models' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-y-auto p-6 space-y-6">
      
      {/* ── TOP OPERATIONAL BAR ── */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2 font-mono">
              IBVAP // JOINT COMMAND OPERATIONS CENTER
            </h1>
            <p className="text-xs text-slate-400">
              Ministry of Home Affairs · SSB Police II Division · Sector 4 Surveillance Sector
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-400">
            {currentTime.split('T')[0]} {currentTime.split('T')[1].split('.')[0]} UTC
          </div>
          <Button
            size="sm"
            onClick={() => setIsZoneModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40"
          >
            <Shield size={14} /> Setup Restricted Zone (4-Point)
          </Button>
          <Button
            size="sm"
            onClick={() => openVideoModal('BOP-01')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <Upload size={14} /> Change Source Feed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/presentation')}
            className="text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-semibold"
          >
            SIH Presentation Mode
          </Button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS (CLICKABLE DRILL-DOWN TO REAL RECORDS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => navigate(kpi.link)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-cyan-500/70 hover:bg-slate-850 hover:shadow-lg hover:shadow-cyan-950/40 hover:scale-[1.02] cursor-pointer transition-all group shadow select-none"
            title={`Click to open ${kpi.label} records`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono group-hover:text-cyan-300 transition-colors">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="mt-3 flex justify-between items-baseline">
              <div className="text-lg font-bold text-white font-mono">{kpi.value}</div>
              <span className="text-[10px] text-cyan-400/80 font-mono flex items-center group-hover:text-cyan-300 transition-colors">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN TACTICAL GRID: LIVE ANNOTATED MJPEG STREAM (LEFT) + REAL-TIME ALERTS (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT (2 COLS): Real-time Annotated Video Feed (<img> MJPEG) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Live MJPEG Surveillance Stream (YOLOv8 + ByteTrack Overlays)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showHeatmap ? "default" : "outline"}
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`text-xs font-mono h-7 px-2.5 ${showHeatmap ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400' : 'text-amber-400 border-amber-500/40 hover:bg-amber-950/40'}`}
              >
                {showHeatmap ? '🔥 Heatmap Active' : '🔥 View Heatmap'}
              </Button>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                LIVE 30 FPS
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/surveillance')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono h-7 px-2"
              >
                Multi-Wall →
              </Button>
            </div>
          </div>

          {/* Primary Annotated Video Container */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center min-h-[420px]">
            
            {/* Top HUD Overlay */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80">
              <span className={`w-2.5 h-2.5 rounded-full ${showHeatmap ? 'bg-amber-500' : 'bg-emerald-500'} animate-ping`} />
              <span className="font-mono text-xs text-white font-bold">
                {showHeatmap ? 'CUMULATIVE FOOT TRAFFIC HEATMAP' : 'CAM-01 // BOP MAIN GATE'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {showHeatmap ? 'DENSITY INTENSITY (JET)' : 'AI ACTIVE HUD'}
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] font-mono text-slate-300">
              <span className="text-red-400 font-bold">● REC</span>
              <span>1080p</span>
              <button 
                onClick={() => openInspection('BOP-01')}
                className="p-1 hover:text-cyan-400 rounded transition-colors"
                title="Fullscreen Inspection"
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* ── MJPEG Video / Heatmap Element ── */}
            <img 
              src={showHeatmap ? "/heatmap" : "/video_feed"} 
              alt="IBVAP Live Real-Time Annotated Video Feed"
              className="w-full h-auto aspect-video object-cover"
              onError={() => setStreamHealthy(false)}
              onLoad={() => setStreamHealthy(true)}
            />

            {/* Bottom Telemetry Overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-4">
                <span>ZONE: <strong className="text-amber-400">SECTOR 4 PERIMETER</strong></span>
                <span className="hidden sm:inline">TRACKING: <strong className="text-cyan-400">BYTETRACK RE-ID</strong></span>
              </div>
              <div>
                <span>{currentTime.split('T')[1].split('.')[0]} UTC</span>
              </div>
            </div>

            {!streamHealthy && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Video className="w-12 h-12 text-red-500 animate-pulse" />
                <span className="font-mono text-sm">Connecting to MJPEG /video_feed stream...</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (1 COL): Real-time Alerts Sidebar */}
        <div className="space-y-6">
          
          {/* Live Alert Feed Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-amber-400 animate-bounce" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">Live Threat Feed</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">
                {liveAlerts.filter(a => a.severity === 'critical').length} CRITICAL
              </span>
            </div>

            {/* Scrollable list with newest alerts prepended at top */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {liveAlerts.map((alt, idx) => (
                <div
                  key={`${alt.id}-${idx}`}
                  onClick={() => openInspection(alt.camera)}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-cyan-500 cursor-pointer transition-all space-y-1.5 group hover:bg-slate-900/50 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{alt.id} · {alt.camera}</span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      alt.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                      alt.severity === 'high' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                      alt.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {alt.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                    <span>{alt.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{alt.time}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <span>Target ID: <strong className="text-white">#{alt.trackingId}</strong> ({alt.confidence})</span>
                    <span className="text-amber-400 font-bold">Risk: {alt.riskScore}/100</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/alerts')}
                className="w-full text-xs font-mono text-slate-300"
              >
                View Full Alert Console & Risk Engine →
              </Button>
            </div>
          </div>

          {/* Quick Geospatial Intelligence Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">Geospatial Intelligence</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/map')} className="text-xs text-cyan-400 font-mono h-6 p-1">
                Open Map →
              </Button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Sector 4 Restricted Alpha:</span>
                <span className="text-red-400 font-bold">ACTIVE TRIPWIRE ON</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Highway Corridor 1:</span>
                <span className="text-emerald-400 font-bold">CLEAR (32 Vehicles/h)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Edge Sync State:</span>
                <span className="text-cyan-400 font-bold">8 / 8 NODES ONLINE</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Global Modals */}
      <VideoSourceModal />
      <VideoInspectionModal />
      <ObjectInspectorModal />
      <ZoneSetupModal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} />

    </div>
  );
};

export default CommandCenter;
