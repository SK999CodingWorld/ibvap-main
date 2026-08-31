import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, RefreshCw, Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const DEMO_CAMERAS = [
  { id: 'BOP-01', name: 'BOP Main Gate', location: 'Sector 4', status: 'online', res: '1080p', fps: 30, zone: 'Red', health: 98 },
  { id: 'BOP-02', name: 'BOP Perimeter E', location: 'Sector 4', status: 'online', res: '1080p', fps: 30, zone: 'Red', health: 95 },
  { id: 'BOP-03', name: 'BOP Perimeter W', location: 'Sector 4', status: 'online', res: '1080p', fps: 28, zone: 'Red', health: 88 },
  { id: 'CHECK-01', name: 'Hwy Check Alpha', location: 'Highway 1', status: 'online', res: '4K', fps: 24, zone: 'Yellow', health: 92 },
  { id: 'ROAD-01', name: 'Approach Rd N', location: 'Sector 2', status: 'online', res: '1080p', fps: 30, zone: 'Yellow', health: 99 },
  { id: 'ROAD-02', name: 'Approach Rd S', location: 'Sector 2', status: 'degraded', res: '1080p', fps: 15, zone: 'Yellow', health: 65 },
  { id: 'GATE-01', name: 'Base Camp Entry', location: 'HQ', status: 'online', res: '1080p', fps: 30, zone: 'Green', health: 100 },
  { id: 'WATCH-01', name: 'Watchtower 7', location: 'Sector 5', status: 'offline', res: '4K', fps: 0, zone: 'Red', health: 0 },
];

export const CameraManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 bg-slate-950 min-h-full text-slate-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Camera Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and configure connected surveillance devices</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Camera
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg mr-4">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">142</div>
            <div className="text-sm text-slate-400">Total Cameras</div>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">128</div>
            <div className="text-sm text-slate-400">Online</div>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg mr-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">9</div>
            <div className="text-sm text-slate-400">Degraded</div>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg mr-4">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-sm text-slate-400">Offline</div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search cameras..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Camera ID & Name</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Specs</th>
                <th className="px-6 py-3 font-medium">Zone</th>
                <th className="px-6 py-3 font-medium">Health</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CAMERAS.map((cam, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{cam.id}</div>
                    <div className="text-xs text-slate-500">{cam.name}</div>
                  </td>
                  <td className="px-6 py-4">{cam.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      cam.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      cam.status === 'degraded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {cam.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{cam.res}</div>
                    <div className="text-xs text-slate-500">{cam.fps} FPS</div>
                  </td>
                  <td className="px-6 py-4">{cam.zone}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cam.health > 80 ? 'bg-green-500' : cam.health > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{width: `${cam.health}%`}}
                      />
                    </div>
                    <div className="text-xs mt-1 text-slate-400">{cam.health}%</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><RefreshCw className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Add New Camera</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Camera ID</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-cyan-500 outline-none" placeholder="e.g. BOP-04" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Cancel</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500">Save Camera</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
