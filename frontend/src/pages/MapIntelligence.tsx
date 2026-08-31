import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, AlertTriangle, ShieldAlert, Activity, CheckCircle2, Navigation } from 'lucide-react';

const cameras = [
  { id: 'BOP-01', name: 'Border Outpost Alpha', lat: 27.05, lon: 88.45, status: 'online', alertLevel: 'critical', detections: 12, health: 95 },
  { id: 'BOP-02', name: 'Border Outpost Bravo', lat: 27.03, lon: 88.48, status: 'online', alertLevel: 'low', detections: 2, health: 98 },
  { id: 'BOP-03', name: 'Border Outpost Charlie', lat: 27.07, lon: 88.52, status: 'online', alertLevel: 'low', detections: 0, health: 100 },
  { id: 'CHECK-01', name: 'Checkpoint Charlie', lat: 27.02, lon: 88.50, status: 'online', alertLevel: 'medium', detections: 5, health: 92 },
  { id: 'ROAD-01', name: 'Access Road North', lat: 27.06, lon: 88.47, status: 'online', alertLevel: 'high', detections: 8, health: 88 },
  { id: 'ROAD-02', name: 'Access Road South', lat: 27.01, lon: 88.49, status: 'offline', alertLevel: 'low', detections: 0, health: 0 },
  { id: 'GATE-01', name: 'Main Gate Entry', lat: 27.04, lon: 88.51, status: 'online', alertLevel: 'low', detections: 1, health: 99 },
  { id: 'WATCH-01', name: 'Watchtower Delta', lat: 27.08, lon: 88.46, status: 'online', alertLevel: 'low', detections: 0, health: 100 },
];

const zones = [
  { id: 'Z-01', name: 'No Go Zone A', coordinates: [[27.04, 88.44], [27.06, 88.44], [27.06, 88.46], [27.04, 88.46]] }
];

const tracks = [
  { id: 'TRK-001', path: [[27.03, 88.48], [27.04, 88.50], [27.04, 88.51]] }
];

const incidents = [
  { id: 'INC-001', lat: 27.055, lon: 88.455, type: 'Unauthorized Crossing', severity: 'critical' }
];

// Custom icons based on status
const createIcon = (color: string, pulsing: boolean) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-4 h-4 rounded-full bg-${color}-500 border-2 border-slate-900 ${pulsing ? 'animate-ping' : ''}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const getIcon = (status: string, alertLevel: string) => {
  if (status === 'offline') return createIcon('red', false);
  if (alertLevel === 'critical') return createIcon('red', true);
  if (alertLevel === 'high') return createIcon('amber', true);
  return createIcon('emerald', false);
};

export function MapIntelligence() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  return (
    <div className={`flex h-full bg-slate-950 text-slate-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[27.05, 88.48]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', zIndex: 10 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          
          <style>{`
            .map-tiles {
              filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
          `}</style>

          {/* Zones */}
          {zones.map(zone => (
            <Polygon 
              key={zone.id} 
              positions={zone.coordinates as [number, number][]} 
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2, weight: 2 }}
            />
          ))}

          {/* Tracks */}
          {tracks.map(track => (
            <Polyline 
              key={track.id} 
              positions={track.path as [number, number][]} 
              pathOptions={{ color: '#0ea5e9', weight: 3, dashArray: '5, 10' }}
            />
          ))}

          {/* Cameras */}
          {cameras.map(camera => (
            <Marker 
              key={camera.id} 
              position={[camera.lat, camera.lon]} 
              icon={getIcon(camera.status, camera.alertLevel)}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[200px] bg-slate-900 text-slate-200 rounded-lg shadow-xl border border-slate-800">
                  <h3 className="font-bold text-lg mb-1">{camera.name}</h3>
                  <div className="text-sm text-slate-400 mb-3">ID: {camera.id}</div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={camera.status === 'online' ? 'text-emerald-500' : 'text-red-500'}>
                        {camera.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detections:</span>
                      <span className="font-mono">{camera.detections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health:</span>
                      <span className="font-mono">{camera.health}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors">
                    View Camera
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Incidents */}
          {incidents.map(inc => (
            <Marker 
              key={inc.id}
              position={[inc.lat, inc.lon]}
              icon={L.divIcon({
                className: 'incident-icon',
                html: `<div class="text-red-500 bg-slate-900/80 rounded-full p-1 border border-red-500/50 animate-pulse"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              })}
            />
          ))}
        </MapContainer>
        
        {/* Overlays */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-sm shadow-lg flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <span className="font-semibold text-slate-200">Map Controls</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-20">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Navigation size={18} className="text-blue-500" />
            Map Intelligence
          </h2>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {/* Legend */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Legend</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Camera Online</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Camera Offline</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
                <span>Active Alert</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle size={14} className="text-red-500" />
                <span>Active Incident</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 border-t-2 border-blue-500 border-dashed"></div>
                <span>Movement Track</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500/20 border border-red-500"></div>
                <span>Virtual Fence / Zone</span>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-slate-800"></div>
          
          {/* Active Incidents */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Incidents</h3>
            {incidents.map(inc => (
              <div key={inc.id} className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex items-start gap-3">
                <ShieldAlert size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-red-400 text-sm">{inc.type}</div>
                  <div className="text-xs text-slate-400 mt-1">{inc.id} • Lat: {inc.lat}, Lon: {inc.lon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-800"></div>
          
          {/* Status Summary */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-2xl font-light text-emerald-400">7</div>
                <div className="text-xs text-slate-400 mt-1">Cameras Online</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-2xl font-light text-red-400">1</div>
                <div className="text-xs text-slate-400 mt-1">Cameras Offline</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
