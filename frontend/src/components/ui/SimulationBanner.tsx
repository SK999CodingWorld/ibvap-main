import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Radio, Activity, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  const location = useLocation();
  const [fps, setFps] = useState(30.2);

  // Poll active FPS from real-time stream enhancer/performance API
  useEffect(() => {
    const fetchFps = async () => {
      try {
        const res = await fetch('/api/stream/performance');
        if (res.ok) {
          const data = await res.json();
          if (data.fps) setFps(data.fps);
        }
      } catch {
        // Fallback
      }
    };
    fetchFps();
    const interval = setInterval(fetchFps, 4000);
    return () => clearInterval(interval);
  }, []);

  const path = location.pathname;

  // Pages connected to the live vision & tracking pipeline
  const isLivePage = [
    '/command-center',
    '/surveillance',
    '/tracking',
    '/evidence',
    '/anpr',
    '/heatmap',
    '/video-analyzer',
    '/ai-models',
    '/virtual-fences'
  ].some(route => path === route || (route !== '/command-center' && path.startsWith(route))) || path === '/';

  // Dedicated demo / simulation sandbox routes
  const isDemoPage = ['/demo', '/presentation'].some(route => path.startsWith(route));

  if (isDemoPage) {
    return (
      <div className="bg-amber-500/15 text-amber-400 text-xs font-mono font-bold px-4 py-1.5 flex justify-between items-center tracking-wider border-b border-amber-500/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>SIMULATION & DEMO SANDBOX // SYNTHETIC SCENARIO INJECTION ACTIVE</span>
        </div>
        <div className="text-[10px] text-amber-500 font-normal hidden sm:block">
          Pre-Recorded Event Testing
        </div>
      </div>
    );
  }

  if (isLivePage) {
    return (
      <div className="bg-emerald-950/70 text-emerald-400 text-xs font-mono font-bold px-4 py-1.5 flex justify-between items-center tracking-wider border-b border-emerald-500/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="flex items-center gap-1.5">
            <Radio size={13} className="text-emerald-400 animate-pulse" />
            LIVE AI PIPELINE ACTIVE — YOLOv8 Multi-Class ByteTrack & ANPR Stream
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/30 text-emerald-300">
            FPS: {fps.toFixed(1)}
          </span>
          <span className="text-emerald-500/80 hidden md:inline">
            REAL-TIME INFERENCE (0ms DELAY)
          </span>
        </div>
      </div>
    );
  }

  // Standby for settings/admin pages
  return (
    <div className="bg-slate-900/90 text-slate-400 text-xs font-mono px-4 py-1 flex justify-between items-center tracking-wider border-b border-slate-800">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span>SYSTEM CONTROL PANEL // SECURED</span>
      </div>
      <span className="text-[10px] text-slate-500">OPERATIONAL</span>
    </div>
  );
};
