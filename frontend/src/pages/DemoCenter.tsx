import React, { useState } from 'react';
import { Play, Square, FastForward, Zap, Shield, Car, Users, WifiOff, CameraOff, Link2, FileCheck, Eye } from 'lucide-react';

const SCENARIOS = [
  { id: 'normal', name: 'Normal Surveillance', icon: Eye, desc: 'Standard border monitoring' },
  { id: 'intrusion', name: 'Person Intrusion', icon: Users, desc: 'Person enters restricted red zone' },
  { id: 'night_intrusion', name: 'Night Intrusion', icon: Users, desc: 'Thermal/IR detection at night' },
  { id: 'vehicle_anpr', name: 'Vehicle + ANPR', icon: Car, desc: 'Vehicle detected with plate recognition' },
  { id: 'loitering', name: 'Loitering', icon: Users, desc: 'Subject dwelling in area too long' },
  { id: 'multi_camera', name: 'Multi-Camera Track', icon: Link2, desc: 'Subject moves across multiple FOVs' },
  { id: 'network_outage', name: 'Network Outage', icon: WifiOff, desc: 'Simulated connection drop' },
  { id: 'camera_failure', name: 'Camera Failure', icon: CameraOff, desc: 'Hardware or stream failure' },
  { id: 'correlated_incident', name: 'Correlated Incident', icon: Shield, desc: 'Complex multi-event scenario' },
  { id: 'evidence_verify', name: 'Evidence Verification', icon: FileCheck, desc: 'Blockchain integrity check demo' },
];

export const DemoCenter: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [events, setEvents] = useState<string[]>([]);

  const handleTrigger = (scenario: any) => {
    setEvents(prev => [`[${new Date().toLocaleTimeString()}] Triggered: ${scenario.name}`, ...prev]);
  };

  return (
    <div className="p-6 bg-slate-950 min-h-full text-slate-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Zap className="w-6 h-6 mr-2 text-cyan-400" />
            Demo / Simulation Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Control the simulation engine for presentation</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all">
          PRESENTATION MODE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Control Panel */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Engine Controls</h2>
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsRunning(true)}
                className={`flex items-center px-4 py-2 rounded font-medium ${isRunning ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                <Play className="w-4 h-4 mr-2" /> START
              </button>
              <button 
                onClick={() => setIsRunning(false)}
                className={`flex items-center px-4 py-2 rounded font-medium ${!isRunning ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                <Square className="w-4 h-4 mr-2" /> STOP
              </button>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400 mr-2">Speed:</span>
              {[0.5, 1, 2, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1 rounded text-sm font-mono ${speed === s ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <h3 className="text-md font-semibold text-white mb-3 mt-8">Trigger Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SCENARIOS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 bg-slate-900 rounded text-cyan-400 mr-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{s.name}</div>
                      <div className="text-slate-500 text-xs">{s.desc}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTrigger(s)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-all"
                  >
                    Trigger
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col h-[600px]">
          <h2 className="text-lg font-semibold text-white mb-4">Simulation Event Log</h2>
          <div className="flex-grow bg-slate-950 rounded border border-slate-800 p-2 overflow-y-auto font-mono text-xs">
            {events.length === 0 ? (
              <div className="text-slate-500 text-center mt-10">No events yet. Start simulation or trigger a scenario.</div>
            ) : (
              events.map((e, i) => (
                <div key={i} className="mb-2 text-cyan-300 border-b border-slate-800/50 pb-1">{e}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
