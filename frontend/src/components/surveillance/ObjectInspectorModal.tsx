import React from 'react';
import { useVideoStore, BoundingBox } from '@/stores/videoStore';
import { 
  X, Shield, User, Car, AlertTriangle, Activity, 
  MapPin, Compass, Gauge, Clock, ChevronRight, FileText, CheckCircle2,
  Sparkles, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ObjectInspectorModal: React.FC = () => {
  const { inspectedObject, inspectObject, inspectingCameraId } = useVideoStore();

  if (!inspectedObject) return null;

  const obj = inspectedObject;
  const isPerson = obj.type === 'PERSON';
  const isVehicle = obj.type === 'VEHICLE';
  const isAnimal = obj.type === 'ANIMAL';

  const getRiskColor = (score?: number) => {
    if (!score) return 'text-slate-400 bg-slate-800 border-slate-700';
    if (score >= 80) return 'text-red-400 bg-red-950/60 border-red-500/50';
    if (score >= 60) return 'text-orange-400 bg-orange-950/60 border-orange-500/50';
    if (score >= 40) return 'text-amber-400 bg-amber-950/60 border-amber-500/50';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {isPerson && <User size={20} />}
              {isVehicle && <Car size={20} />}
              {isAnimal && <Shield size={20} />}
              {!isPerson && !isVehicle && !isAnimal && <Layers size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">{obj.trackingId}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {obj.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Confidence: <span className="text-emerald-400 font-bold">{obj.confidence}%</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Channel: <span className="text-cyan-400 font-mono">{inspectingCameraId || 'BOP-01'}</span> · Zone: {obj.zone}
              </p>
            </div>
          </div>

          <button 
            onClick={() => inspectObject(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* ANIMAL FILTER BANNER */}
          {isAnimal && obj.animalAttrs && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-300">HUMAN vs ANIMAL FILTER: ACTIVE</div>
                <div className="text-slate-300 mt-0.5">{obj.animalAttrs.filterReason}</div>
                <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
                  Species: {obj.animalAttrs.species.toUpperCase()} · Prevents False Perimeter Alarms
                </div>
              </div>
            </div>
          )}

          {/* RISK ENGINE SCORE & BREAKDOWN */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white uppercase flex items-center gap-1.5 font-sans">
                <AlertTriangle size={14} className="text-amber-400" />
                Explainable Risk Assessment
              </span>
              <div className={`px-3 py-1 rounded-lg border font-mono font-bold text-sm ${getRiskColor(obj.riskScore)}`}>
                {obj.riskScore ?? 15} / 100 — {obj.alertLevel.toUpperCase()}
              </div>
            </div>

            {obj.riskFactors && obj.riskFactors.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Observable Threat Factors:</div>
                {obj.riskFactors.map((rf, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800/60 font-mono">
                    <span>{rf.factor}</span>
                    <span className={rf.weight > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {rf.weight > 0 ? `+${rf.weight}` : rf.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MOTION INTELLIGENCE & TRAJECTORY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1"><Gauge size={12} /> Velocity</div>
              <div className="text-sm font-bold text-white mt-1">{obj.speed}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1"><Compass size={12} /> Heading Vector</div>
              <div className="text-sm font-bold text-cyan-400 mt-1">{obj.direction}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={12} /> Dwell Time</div>
              <div className="text-sm font-bold text-amber-400 mt-1">{obj.dwellTimeSeconds ? `${Math.floor(obj.dwellTimeSeconds / 60)}m ${obj.dwellTimeSeconds % 60}s` : '00m 45s'}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={12} /> Distance</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{obj.distanceTravelledMeters ? `${obj.distanceTravelledMeters} m` : '28.4 m'}</div>
            </div>
          </div>

          {/* SMOOTHED TRAJECTORY TRAIL */}
          {obj.trajectories && obj.trajectories.length > 0 && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-400" />
                Motion Trajectory History (Smoothed Vector)
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1 font-mono text-[10px]">
                {obj.trajectories.map((pt, i) => (
                  <React.Fragment key={i}>
                    <div className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-slate-300 whitespace-nowrap">
                      ● ({pt.x}%, {pt.y}%) @ {pt.timestamp}
                    </div>
                    {i < obj.trajectories!.length - 1 && <span className="text-cyan-500 font-bold">──→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* PERSON SPECIFIC ATTRIBUTES & POSE */}
          {isPerson && obj.personAttrs && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-white">Non-Sensitive Visual Attributes & Pose</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Pose Action:</span> <span className="text-cyan-300 font-bold uppercase">{obj.personAttrs.poseAction}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Movement State:</span> <span className="text-white font-mono">{obj.personAttrs.movementState}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Upper Clothing:</span> <span className="text-white">{obj.personAttrs.clothingUpperColor || 'Dark Navy'}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Backpack / Payload:</span> <span className={obj.personAttrs.hasBackpack ? 'text-amber-400 font-bold' : 'text-slate-400'}>{obj.personAttrs.hasBackpack ? 'YES (Detected)' : 'NO'}</span>
                </div>
              </div>
            </div>
          )}

          {/* VEHICLE ATTRIBUTES & ANPR */}
          {isVehicle && obj.vehicleAttrs && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-white">Vehicle Classification & ANPR Engine</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Vehicle Type:</span> <span className="text-cyan-300 font-bold uppercase">{obj.vehicleAttrs.vehicleType}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">License Plate:</span> <span className="text-amber-300 font-mono font-bold">{obj.vehicleAttrs.plateNumber || 'MH 12 AB 1234'}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Plate Status:</span> <span className="text-emerald-400 font-mono">{obj.vehicleAttrs.plateStatus || 'CONFIRMED'}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Corridor Lane:</span> <span className="text-white">{obj.vehicleAttrs.lane || 'Lane 1'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">
            Model: YOLOv8x-Edge + ByteTrack (Audit Logged)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => inspectObject(null)}>
              Close
            </Button>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
              Track Across Cameras
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
