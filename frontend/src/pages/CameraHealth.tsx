import React from 'react';
import { Activity, ShieldAlert, Cpu, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockHealthData = [
  { time: '10:00', score: 98 }, { time: '10:05', score: 97 },
  { time: '10:10', score: 99 }, { time: '10:15', score: 95 },
  { time: '10:20', score: 90 }, { time: '10:25', score: 85 },
  { time: '10:30', score: 88 }, { time: '10:35', score: 92 },
  { time: '10:40', score: 96 }, { time: '10:45', score: 98 },
];

const CAMERAS = [
  { id: 'BOP-01', name: 'BOP Main Gate', score: 98, latency: '45ms', issues: [] },
  { id: 'ROAD-02', name: 'Approach Rd S', score: 65, latency: '240ms', issues: ['High Latency', 'Low FPS'] },
  { id: 'WATCH-01', name: 'Watchtower 7', score: 0, latency: '-', issues: ['Stream Offline', 'Network Unreachable'] },
];

export const CameraHealth: React.FC = () => {
  return (
    <div className="p-6 bg-slate-950 min-h-full text-slate-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Camera Health Diagnostics</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time health monitoring and issue detection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center text-slate-400 mb-2">
            <Activity className="w-4 h-4 mr-2" /> Average Health
          </div>
          <div className="text-3xl font-bold text-white">92%</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center text-slate-400 mb-2">
            <Cpu className="w-4 h-4 mr-2" /> AI Inference Status
          </div>
          <div className="text-3xl font-bold text-green-400">Optimal</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center text-slate-400 mb-2">
            <Wifi className="w-4 h-4 mr-2" /> Network Status
          </div>
          <div className="text-3xl font-bold text-amber-400">Degraded</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center text-slate-400 mb-2">
            <ShieldAlert className="w-4 h-4 mr-2" /> Active Issues
          </div>
          <div className="text-3xl font-bold text-red-400">3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">System Health Trend (Last Hour)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Critical Cameras</h2>
          <div className="space-y-4">
            {CAMERAS.map((cam) => (
              <div key={cam.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-white">{cam.id}</div>
                  <div className={`text-sm font-bold ${cam.score > 80 ? 'text-green-400' : cam.score > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {cam.score}%
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mb-2">
                  <div 
                    className={`h-full rounded-full ${cam.score > 80 ? 'bg-green-500' : cam.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{width: `${cam.score}%`}}
                  />
                </div>
                {cam.issues.length > 0 ? (
                  <div className="text-xs text-red-400 space-y-1">
                    {cam.issues.map((issue, i) => <div key={i}>• {issue}</div>)}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">No issues detected</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
