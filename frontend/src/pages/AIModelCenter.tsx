import React, { useState } from 'react';
import { 
  Cpu, CheckCircle2, AlertTriangle, Shield, Eye, 
  Activity, Layers, Sparkles, Filter, Lock, Terminal, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const AI_PIPELINES = [
  {
    id: 'detector',
    name: 'YOLOv8x-Border / RT-DETR',
    role: 'Primary Object Detection & Taxonomy',
    version: 'v2.4.1-edge',
    status: 'ACTIVE',
    hardware: 'NVIDIA RTX / Edge TensorRT',
    latency: '18.4 ms',
    fps: '48.2 FPS',
    classesCount: 24,
    description: 'Detects people, vehicles, animals, and general surveillance objects with bounding box confidence.'
  },
  {
    id: 'tracker',
    name: 'ByteTrack-Border Multi-Target Re-ID',
    role: 'Multi-Object Tracking & Motion Vectors',
    version: 'v3.1.0',
    status: 'ACTIVE',
    hardware: 'Edge Multi-core CPU (Vectorized)',
    latency: '3.8 ms',
    fps: '120.0 FPS',
    classesCount: 18,
    description: 'Maintains consistent tracking IDs (P-104, V-021), trajectory smoothing, and velocity estimation.'
  },
  {
    id: 'anpr',
    name: 'PaddleOCR-v4 + STN Rectification',
    role: '8-Stage ANPR License Plate Engine',
    version: 'v4.2',
    status: 'ACTIVE',
    hardware: 'Edge GPU / FP16 Tensor Cores',
    latency: '12.6 ms',
    fps: '32.0 FPS',
    classesCount: 1,
    description: 'High-angle perspective correction, contrast enhancement, and temporal consensus voting.'
  },
  {
    id: 'face',
    name: 'RetinaFace Quality & Occlusion Engine',
    role: 'Face Detection (Audited Authorization)',
    version: 'v1.2',
    status: 'ACTIVE (Audited)',
    hardware: 'Edge GPU / Encrypted Sandbox',
    latency: '9.2 ms',
    fps: '55.0 FPS',
    classesCount: 1,
    description: 'Detects facial presence and assesses image quality/occlusion without automatic identification.'
  },
  {
    id: 'behavior',
    name: 'Explainable Spatio-Temporal Risk Engine',
    role: 'Behavior, Loitering & Virtual Tripwires',
    version: 'v2.0',
    status: 'ACTIVE',
    hardware: 'Real-time Symbolic Graph Engine',
    latency: '1.4 ms',
    fps: '500.0 FPS',
    classesCount: 12,
    description: 'Evaluates virtual fence breaches, 120s loitering thresholds, animal filters, and crowd density.'
  }
];

const CAPABILITY_MATRIX = [
  { model: 'Object Detector', capability: 'Human Detection & Multi-person', status: 'ACTIVE', accuracy: '96.4%', category: 'People', hardware: 'Edge GPU' },
  { model: 'Object Detector', capability: 'Vehicle Classification (Cars, SUVs, Trucks, Buses)', status: 'ACTIVE', accuracy: '98.2%', category: 'Vehicles', hardware: 'Edge GPU' },
  { model: 'Object Detector', capability: 'Animal vs Human Filter (Dogs, Cattle, Birds)', status: 'ACTIVE', accuracy: '92.1%', category: 'Animals', hardware: 'Edge GPU' },
  { model: 'Object Detector', capability: 'General Objects (Backpacks, Packages, Cones)', status: 'ACTIVE', accuracy: '91.5%', category: 'Objects', hardware: 'Edge GPU' },
  { model: 'Object Detector', capability: 'Concealed Weapon / Diver Detection', status: 'NOT ENABLED', accuracy: 'N/A', category: 'Specialized', hardware: 'N/A' },
  { model: 'Object Tracker', capability: 'Trajectory Smoothing & Speed Calculation', status: 'ACTIVE', accuracy: '94.8%', category: 'Motion', hardware: 'Edge CPU' },
  { model: 'Object Tracker', capability: 'Cross-Camera Appearance Correlation', status: 'ACTIVE', accuracy: '88.5%', category: 'Tracking', hardware: 'Edge CPU' },
  { model: 'OCR Engine', capability: 'ANPR License Plate Recognition', status: 'ACTIVE', accuracy: '97.6%', category: 'ANPR', hardware: 'Edge GPU' },
  { model: 'Face Engine', capability: 'Face Quality & Occlusion Detection', status: 'ACTIVE', accuracy: '89.3%', category: 'Biometrics', hardware: 'Edge GPU' },
  { model: 'Face Engine', capability: 'Automated Identity Matching', status: 'LOCKED (AUDIT REQUIRED)', accuracy: 'Opt-In', category: 'Biometrics', hardware: 'Encrypted Sandbox' },
  { model: 'Behavior Engine', capability: 'Virtual Fence Polygon Breach & Tripwire', status: 'ACTIVE', accuracy: '99.1%', category: 'Behavior', hardware: 'Edge CPU' },
  { model: 'Behavior Engine', capability: 'Loitering Detection (>120s)', status: 'ACTIVE', accuracy: '98.5%', category: 'Behavior', hardware: 'Edge CPU' },
  { model: 'Behavior Engine', capability: 'Crowd Density & Growth Alerting', status: 'ACTIVE', accuracy: '95.0%', category: 'Behavior', hardware: 'Edge CPU' },
  { model: 'Vision Quality', capability: 'Night Vision / Low-Light Classifier', status: 'ACTIVE', accuracy: '96.0%', category: 'Quality', hardware: 'Edge GPU' },
  { model: 'Vision Quality', capability: 'Camera Tampering & Obstruction Watchdog', status: 'ACTIVE', accuracy: '99.4%', category: 'Quality', hardware: 'Edge CPU' }
];

export const AIModelCenter: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filteredMatrix = CAPABILITY_MATRIX.filter(c => {
    if (filterCategory === 'ALL') return true;
    return c.category === filterCategory;
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-y-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-cyan-400 w-6 h-6" />
            AI Model Center & Capability Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time status, hardware allocation, inference latency, and verified capability taxonomies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ALL 5 ENGINES OPERATIONAL
          </div>
        </div>
      </div>

      {/* 5 Core Pipelines Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_PIPELINES.map((pipe) => (
          <div key={pipe.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  {pipe.version}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> {pipe.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{pipe.name}</h3>
              <div className="text-xs text-cyan-300 font-mono mt-0.5">{pipe.role}</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{pipe.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Latency</div>
                <div className="text-emerald-400 font-bold mt-0.5">{pipe.latency}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Throughput</div>
                <div className="text-white font-bold mt-0.5">{pipe.fps}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Classes</div>
                <div className="text-cyan-400 font-bold mt-0.5">{pipe.classesCount} Active</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Capability Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" />
              Verified Model Capability Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Only capabilities actively supported by the model architecture are marked as Active.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="People">People & Pose</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Animals">Animals</option>
              <option value="Behavior">Behavior & Fences</option>
              <option value="ANPR">ANPR</option>
              <option value="Quality">Image Quality</option>
              <option value="Specialized">Specialized</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="p-3">Model Pipeline</th>
                <th className="p-3">Specific Capability</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Hardware / Engine</th>
                <th className="p-3">Benchmark Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-200">{row.model}</td>
                  <td className="p-3 text-cyan-300">{row.capability}</td>
                  <td className="p-3 text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{row.category}</span>
                  </td>
                  <td className="p-3">
                    {row.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} /> ACTIVE
                      </span>
                    )}
                    {row.status.includes('LOCKED') && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1 w-fit">
                        <Lock size={11} /> {row.status}
                      </span>
                    )}
                    {row.status === 'NOT ENABLED' && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 font-bold flex items-center gap-1 w-fit">
                        <AlertTriangle size={11} /> NOT ENABLED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">{row.hardware}</td>
                  <td className="p-3 text-emerald-400 font-bold">{row.accuracy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AIModelCenter;
