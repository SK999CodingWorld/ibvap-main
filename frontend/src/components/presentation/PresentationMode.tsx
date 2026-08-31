import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ChevronRight, ChevronLeft, Play, Pause, AlertTriangle, 
  Shield, Server, Network, ShieldAlert, FileText, Camera, MapPin, Target, Eye
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Normal Surveillance', desc: 'System operating normally. AI monitoring 15 FPS per camera. Bandwidth usage optimized.' },
  { id: 2, title: 'Person Detected', desc: 'AI detects human presence in Sector 4. Confidence: 94%. Bounding boxes applied.' },
  { id: 3, title: 'Restricted Zone Entry', desc: 'Subject crosses virtual fence into restricted zone. Alert triggered.' },
  { id: 4, title: 'Risk Score Increases', desc: 'Behavior analysis flags loitering. Threat level escalated from Low to High.' },
  { id: 5, title: 'Alert Generated', desc: 'High priority alert dispatched to Command Center. Latency: 45ms.' },
  { id: 6, title: 'Multi-Camera Correlation', desc: 'Subject tracked across CAM-02 and CAM-03 using temporal ID correlation.' },
  { id: 7, title: 'Incident Created', desc: 'Multiple related alerts automatically grouped into a single Incident Report.' },
  { id: 8, title: 'Evidence Secured', desc: 'Video snapshot secured with SHA-256 hash for forensic integrity.' },
  { id: 9, title: 'Network Failure', desc: 'Simulated connection loss to Sector 4 edge node. Main link offline.' },
  { id: 10, title: 'Edge AI Continues', desc: 'Edge node continues AI inference locally. Events queued in local storage.' },
  { id: 11, title: 'Network Restored', desc: 'Connection re-established. Edge node transitions to online state.' },
  { id: 12, title: 'Events Synchronized', desc: 'Pending events synced to central database. No data loss.' },
];

export const PresentationMode = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => prev < STEPS.length ? prev + 1 : 1);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const step = STEPS[currentStep - 1];

  // Derived mock data based on step
  const riskScore = currentStep < 3 ? 12 : currentStep < 4 ? 45 : 87;
  const isAlerting = currentStep >= 3;
  const showBoundingBox = currentStep >= 2;
  const isOffline = currentStep === 9 || currentStep === 10;
  const pendingEvents = currentStep === 10 ? 42 : currentStep === 11 ? 12 : 0;
  const hasIncident = currentStep >= 7;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">IBVAP <span className="text-blue-500">SIH 2026</span></h1>
            <p className="text-xs text-slate-400">Intelligent Border Video Analytics Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex flex-col items-center">
              <span className="text-slate-400">LATENCY</span>
              <span className="text-emerald-400">&lt; 50ms</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400">AI FPS</span>
              <span className="text-blue-400">28-30</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400">EDGE SYNC</span>
              <span className="text-emerald-400">Active</span>
            </div>
          </div>
          <button onClick={() => navigate('/command-center')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-4 grid grid-cols-3 grid-rows-2 gap-4 min-h-0">
        {/* Panel 1: Cameras (Takes up 2 columns, 1 row) */}
        <div className="col-span-2 row-span-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative">
          <div className="absolute top-2 left-2 z-10 flex gap-2">
            <span className="px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-mono text-white flex items-center gap-1">
              <Camera className="w-3 h-3 text-blue-400" /> CAM-01 (Sector 4)
            </span>
            {isOffline && (
              <span className="px-2 py-1 bg-red-500/80 backdrop-blur rounded text-xs font-bold text-white flex items-center gap-1 animate-pulse">
                <Network className="w-3 h-3" /> OFFLINE (AI Local)
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-black relative">
            {/* Simulated Camera Feed Background */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1550986518-ffdf01d0a51c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            
            {/* Overlay UI based on steps */}
            {showBoundingBox && (
              <div className={`absolute top-[40%] left-[60%] w-32 h-64 border-2 ${isAlerting ? 'border-red-500' : 'border-blue-500'} bg-blue-500/10 flex flex-col`}>
                <div className={`-mt-6 ${isAlerting ? 'bg-red-500' : 'bg-blue-500'} text-white text-[10px] px-1 py-0.5 whitespace-nowrap font-mono`}>
                  PERSON {isAlerting && '- INTRUDER'} (94%)
                </div>
                {isAlerting && currentStep >= 4 && (
                  <div className="absolute -bottom-6 left-0 text-red-500 text-xs font-mono font-bold whitespace-nowrap bg-black/50 px-1">
                    LOITERING DETECTED
                  </div>
                )}
              </div>
            )}

            {/* Virtual Fence Line */}
            <div className="absolute top-[30%] left-[55%] w-0.5 h-[70%] bg-amber-500/50 flex items-center justify-center -rotate-12">
              <div className="absolute bg-amber-500/20 w-32 h-full -left-32 border-l border-amber-500/30" />
              <span className="bg-amber-500 text-black text-[10px] px-1 -rotate-90 absolute -left-6 top-1/4 font-bold">RESTRICTED ZONE</span>
            </div>

            {/* Correlation Line if step >= 6 */}
            {currentStep >= 6 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 65% 50% L 85% 50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
                <circle cx="85%" cy="50%" r="4" fill="#3b82f6" />
                <text x="75%" y="48%" fill="#3b82f6" fontSize="10" fontFamily="monospace">ID: TRK-892</text>
              </svg>
            )}
          </div>
        </div>

        {/* Panel 2: Live Alert Feed */}
        <div className="col-span-1 row-span-2 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alert Feed
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Live</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {isAlerting && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-red-500 bg-red-500/20 px-2 py-0.5 rounded">CRITICAL</span>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>
                <h4 className="font-semibold text-white text-sm">Restricted Zone Entry</h4>
                <p className="text-xs text-slate-400 mt-1">Sector 4 (CAM-01). Subject breached virtual fence.</p>
              </div>
            )}
            
            {currentStep >= 4 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded">HIGH</span>
                  <span className="text-[10px] text-slate-500">-1m</span>
                </div>
                <h4 className="font-semibold text-white text-sm">Suspicious Loitering</h4>
                <p className="text-xs text-slate-400 mt-1">Subject stationary for &gt;30s near perimeter.</p>
              </div>
            )}

            {hasIncident && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">INCIDENT</span>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>
                <h4 className="font-semibold text-white text-sm flex items-center gap-1">
                  <FileText className="w-3 h-3" /> INC-2026-089
                </h4>
                <p className="text-xs text-slate-400 mt-1">Auto-generated from 3 correlated alerts.</p>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-lg p-3 opacity-60">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">INFO</span>
                <span className="text-[10px] text-slate-500">-5m</span>
              </div>
              <h4 className="font-semibold text-slate-300 text-sm">Routine Patrol Logged</h4>
              <p className="text-xs text-slate-500 mt-1">Authorized vehicle detected.</p>
            </div>
          </div>
        </div>

        {/* Panel 3: Map View */}
        <div className="col-span-1 row-span-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> Sector Map
            </span>
          </div>
          
          <div className="flex-1 bg-[#0f172a] relative border border-slate-800/50 m-1 rounded-lg">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            {/* Border Line */}
            <svg className="absolute inset-0 w-full h-full">
              <path d="M 10% 80% Q 40% 70% 50% 50% T 90% 20%" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
              
              {/* Nodes */}
              <circle cx="20%" cy="75%" r="6" fill={isOffline ? '#ef4444' : '#10b981'} className={isOffline ? 'animate-pulse' : ''} />
              <circle cx="50%" cy="50%" r="6" fill="#10b981" />
              <circle cx="80%" cy="25%" r="6" fill="#10b981" />
              
              {/* Alert Ping */}
              {isAlerting && (
                <>
                  <circle cx="45%" cy="55%" r="15" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping opacity-75" />
                  <circle cx="45%" cy="55%" r="4" fill="#ef4444" />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Panel 4: System Status & Risk */}
        <div className="col-span-1 row-span-1 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-300 text-sm mb-4">Threat Assessment</h3>
            <div className="flex items-end gap-4 mb-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Risk Score</span>
                  <span className={`font-bold ${riskScore > 75 ? 'text-red-500' : riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {riskScore}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${riskScore > 75 ? 'bg-red-500' : riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg transition-colors ${
                riskScore > 75 ? 'border-red-500/20 text-red-500 bg-red-500/10' : 
                riskScore > 40 ? 'border-amber-500/20 text-amber-500 bg-amber-500/10' : 
                'border-emerald-500/20 text-emerald-500 bg-emerald-500/10'
              }`}>
                {riskScore > 75 ? 'HIGH' : riskScore > 40 ? 'MED' : 'LOW'}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <h3 className="font-bold text-slate-300 text-xs mb-2 flex items-center gap-2">
              <Server className="w-3 h-3" /> Edge Node Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Network State:</span>
                {isOffline ? (
                  <span className="text-red-500 font-bold flex items-center gap-1"><X className="w-3 h-3" /> OFFLINE</span>
                ) : (
                  <span className="text-emerald-500 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> ONLINE</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">AI Processing:</span>
                <span className="text-blue-400">Local (Edge)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pending Sync:</span>
                <span className={pendingEvents > 0 ? 'text-amber-500 font-bold' : 'text-slate-500'}>
                  {pendingEvents} events
                </span>
              </div>
              {currentStep === 8 && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-400 break-all leading-tight">
                  <span className="text-slate-500 block mb-0.5">SHA-256 HASH GENERATED:</span>
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="h-24 bg-slate-900 border-t border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">STEP {currentStep}/{STEPS.length}</span>
            <h2 className="text-lg font-bold text-white">{step.title}</h2>
          </div>
          <p className="text-sm text-slate-400">{step.desc}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button 
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="p-2 hover:bg-slate-800 rounded disabled:opacity-50 text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded mx-1 ${isPlaying ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'}`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setCurrentStep(prev => Math.min(STEPS.length, prev + 1))}
              disabled={currentStep === STEPS.length}
              className="p-2 hover:bg-slate-800 rounded disabled:opacity-50 text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="flex gap-2">
            {['EDGE-FIRST', 'EXPLAINABLE', 'RESILIENT'].map(tag => (
              <span key={tag} className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
