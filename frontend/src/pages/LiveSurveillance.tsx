import React, { useState, useEffect } from 'react';
import { 
  Grid, LayoutGrid, Monitor, Maximize, Filter, Plus, 
  Video, Eye, Shield, Camera, RefreshCw, Layers
} from 'lucide-react';
import { CameraCard } from '@/components/surveillance/CameraCard';
import { VideoSourceModal } from '@/components/surveillance/VideoSourceModal';
import { VideoInspectionModal } from '@/components/surveillance/VideoInspectionModal';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/Button';

const DEMO_CAMERAS = [
  { id: 'BOP-01', name: 'Border Outpost 1 PTZ', location: 'Sector 4 Red Zone', status: 'online', fps: 30, aiStatus: true, detections: 1, alertLevel: 'critical', zone: 'red' },
  { id: 'BOP-02', name: 'Border Outpost 2 Thermal', location: 'Sector 4 Buffer Zone', status: 'online', fps: 30, aiStatus: true, detections: 1, alertLevel: 'high', zone: 'red' },
  { id: 'BOP-03', name: 'Border Outpost 3 Fixed', location: 'Perimeter West', status: 'online', fps: 28, aiStatus: true, detections: 1, alertLevel: 'low', zone: 'red' },
  { id: 'CHECK-01', name: 'Highway Check Alpha', location: 'Highway 1 Access', status: 'online', fps: 30, aiStatus: true, detections: 1, alertLevel: 'medium', zone: 'yellow' },
  { id: 'ROAD-01', name: 'Approach Road Aerial', location: 'Sector 2 Corridor', status: 'online', fps: 30, aiStatus: true, detections: 1, zone: 'yellow' },
  { id: 'ROAD-02', name: 'Approach Road South', location: 'Sector 2 Perimeter', status: 'degraded', fps: 15, aiStatus: true, detections: 0, zone: 'yellow' },
  { id: 'GATE-01', name: 'HQ Base Camp Entry', location: 'Main Headquarters', status: 'online', fps: 30, aiStatus: true, detections: 0, zone: 'green' },
  { id: 'WATCH-01', name: 'Watchtower East FOV', location: 'Sector 5 Outpost', status: 'online', fps: 25, aiStatus: true, detections: 0, zone: 'red' },
] as any[];

export const LiveSurveillance: React.FC = () => {
  const [gridSize, setGridSize] = useState<1 | 4 | 9 | 16>(4);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [globalAi, setGlobalAi] = useState(true);
  const [globalZones, setGlobalZones] = useState(true);

  const { openVideoModal, openInspection, toggleAiOverlays, toggleZoneOverlays, cameraConfigs } = useVideoStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGridClass = () => {
    switch(gridSize) {
      case 1: return 'grid-cols-1 max-w-5xl mx-auto';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
      case 9: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 16: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const filteredCameras = DEMO_CAMERAS.filter(c => {
    if (filterZone === 'all') return true;
    return c.zone === filterZone;
  });

  const handleToggleGlobalAi = () => {
    const next = !globalAi;
    setGlobalAi(next);
    DEMO_CAMERAS.forEach(c => {
      if (cameraConfigs[c.id]?.showAiOverlays !== next) {
        toggleAiOverlays(c.id);
      }
    });
  };

  const handleToggleGlobalZones = () => {
    const next = !globalZones;
    setGlobalZones(next);
    DEMO_CAMERAS.forEach(c => {
      if (cameraConfigs[c.id]?.showZoneOverlays !== next) {
        toggleZoneOverlays(c.id);
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-300 overflow-hidden">
      
      {/* Top Action Toolbar */}
      <div className="flex-none p-4 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Live Surveillance Wall
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/20">
                8 CHANNELS LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive multi-stream CCTV grid with active AI bounding boxes, ANPR, and custom video inputs.
            </p>
          </div>
        </div>
        
        {/* Controls & Modals */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Add / Change Video Button */}
          <Button
            onClick={() => openVideoModal('BOP-01')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/30"
          >
            <Video size={14} /> Add / Upload Video Feed
          </Button>

          {/* Quick Toggle Overlays */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={handleToggleGlobalAi}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-all ${
                globalAi ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle AI Bounding Box Overlays"
            >
              <Eye size={13} /> AI HUD
            </button>
            <button
              onClick={handleToggleGlobalZones}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-all ${
                globalZones ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Virtual Perimeter Fences"
            >
              <Shield size={13} /> Fences
            </button>
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => setGridSize(1)} 
              className={`p-1.5 rounded transition-colors ${gridSize === 1 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="1-Camera Focus"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setGridSize(4)} 
              className={`p-1.5 rounded transition-colors ${gridSize === 4 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="2x2 Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setGridSize(9)} 
              className={`p-1.5 rounded transition-colors ${gridSize === 9 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="3x3 Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          {/* Sector Zone Filter */}
          <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-2.5 py-1 border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="all" className="bg-slate-900">All Sectors</option>
              <option value="red" className="bg-slate-900">Red Zone (Restricted)</option>
              <option value="yellow" className="bg-slate-900">Yellow Zone (Highway)</option>
              <option value="green" className="bg-slate-900">Green Zone (Base HQ)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Camera Video Grid */}
      <div className="flex-grow p-5 overflow-y-auto">
        <div className={`grid gap-5 ${getGridClass()}`}>
          {filteredCameras.slice(0, gridSize).map((cam) => (
            <CameraCard 
              key={cam.id}
              camera={{
                ...cam, 
                timestamp: currentTime.split('T')[1].split('.')[0] + ' UTC'
              }}
              onClick={() => openInspection(cam.id)}
            />
          ))}
        </div>
      </div>

      {/* Global Modals */}
      <VideoSourceModal />
      <VideoInspectionModal />

    </div>
  );
};

export default LiveSurveillance;
