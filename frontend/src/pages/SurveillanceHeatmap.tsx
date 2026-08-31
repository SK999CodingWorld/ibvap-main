import React, { useState } from 'react';
import { 
  Flame, MapPin, Activity, Shield, Users, Car, 
  AlertTriangle, Filter, Moon, Clock, ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

const SECTOR_HEATMAP_DATA = [
  { id: 'SEC-04-A', name: 'Sector 4 (Red Zone Alpha)', humanActivity: 92, vehicleActivity: 25, alertScore: 88, intrusions: 14, nightMovement: 76, risk: 'CRITICAL', cameras: ['BOP-01', 'BOP-02'] },
  { id: 'SEC-04-B', name: 'Sector 4 (Buffer Zone West)', humanActivity: 54, vehicleActivity: 12, alertScore: 62, intrusions: 6, nightMovement: 48, risk: 'HIGH', cameras: ['BOP-03', 'WATCH-01'] },
  { id: 'HWY-01', name: 'Highway 1 Checkpoint Alpha', humanActivity: 38, vehicleActivity: 96, alertScore: 45, intrusions: 2, nightMovement: 35, risk: 'MEDIUM', cameras: ['CHECK-01'] },
  { id: 'SEC-02-N', name: 'Sector 2 Approach North', humanActivity: 22, vehicleActivity: 84, alertScore: 30, intrusions: 1, nightMovement: 20, risk: 'LOW', cameras: ['ROAD-01', 'ROAD-02'] },
  { id: 'HQ-MAIN', name: 'HQ Base Camp Perimeter', humanActivity: 70, vehicleActivity: 58, alertScore: 18, intrusions: 0, nightMovement: 15, risk: 'LOW', cameras: ['GATE-01'] }
];

const HOURLY_ACTIVITY = [
  { time: '00:00', human: 8, vehicle: 12, alerts: 3 },
  { time: '03:00', human: 14, vehicle: 8, alerts: 6 },
  { time: '06:00', human: 42, vehicle: 45, alerts: 2 },
  { time: '09:00', human: 68, vehicle: 90, alerts: 4 },
  { time: '12:00', human: 75, vehicle: 95, alerts: 1 },
  { time: '15:00', human: 80, vehicle: 88, alerts: 5 },
  { time: '18:00', human: 62, vehicle: 70, alerts: 7 },
  { time: '21:00', human: 34, vehicle: 30, alerts: 8 }
];

export const SurveillanceHeatmap: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'human' | 'vehicle' | 'night' | 'intrusions'>('all');

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-y-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="text-amber-500 w-6 h-6" />
            Surveillance Activity Heatmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Spatio-temporal activity clustering highlighting high-density zones, intrusion hotspots, and night movements.
          </p>
        </div>

        {/* Filter Metric */}
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: 'Overall Density' },
            { id: 'human', label: 'Human Movement' },
            { id: 'vehicle', label: 'Vehicle Corridors' },
            { id: 'night', label: 'Night Watch' },
            { id: 'intrusions', label: 'Intrusion Hotspots' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === m.id ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sector Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTOR_HEATMAP_DATA.map((sec) => (
          <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                  {sec.id}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{sec.name}</h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                sec.risk === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                sec.risk === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                'bg-slate-800 text-slate-300'
              }`}>
                {sec.risk}
              </span>
            </div>

            {/* Density Bars */}
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span className="flex items-center gap-1"><Users size={12} className="text-cyan-400" /> Human Activity</span>
                  <span className="text-white font-bold">{sec.humanActivity}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${sec.humanActivity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span className="flex items-center gap-1"><Car size={12} className="text-blue-400" /> Vehicle Traffic</span>
                  <span className="text-white font-bold">{sec.vehicleActivity}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sec.vehicleActivity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span className="flex items-center gap-1"><Moon size={12} className="text-purple-400" /> Night Movement</span>
                  <span className="text-white font-bold">{sec.nightMovement}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sec.nightMovement}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Linked: {sec.cameras.join(', ')}</span>
              <span className="text-amber-400 font-bold">{sec.intrusions} Intrusions (24h)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-cyan-400" />
          24-Hour Spatio-Temporal Movement Distribution
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_ACTIVITY}>
              <defs>
                <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVehicle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="human" name="Human Activity" stroke="#06b6d4" fillOpacity={1} fill="url(#colorHuman)" />
              <Area type="monotone" dataKey="vehicle" name="Vehicle Traffic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVehicle)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default SurveillanceHeatmap;
