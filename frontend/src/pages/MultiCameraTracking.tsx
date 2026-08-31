import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Activity, Clock, Map, MapPin, Navigation, Info } from 'lucide-react';

const MOCK_CROSS_TRACKS = [
  {
    id: 'P-097',
    type: 'person',
    firstSeen: '10:35:12',
    lastSeen: '10:42:15',
    currentZone: 'Entry Lobby',
    cameras: [
      { id: 'CAM-05', name: 'Main Gate', time: '10:35:12', duration: '45s' },
      { id: 'CAM-02', name: 'Corridor A', time: '10:38:20', duration: '2m' },
      { id: 'CAM-01', name: 'Entry Lobby', time: '10:41:55', duration: 'Active' },
    ]
  },
  {
    id: 'V-018',
    type: 'vehicle',
    firstSeen: '10:30:00',
    lastSeen: '10:41:30',
    currentZone: 'Main Gate',
    cameras: [
      { id: 'CAM-06', name: 'Parking A', time: '10:30:00', duration: '10m' },
      { id: 'CAM-05', name: 'Main Gate', time: '10:41:15', duration: 'Active' },
    ]
  }
];

export const MultiCameraTracking = () => {
  const [selectedTrack, setSelectedTrack] = useState(MOCK_CROSS_TRACKS[0].id);
  const track = MOCK_CROSS_TRACKS.find(t => t.id === selectedTrack) || MOCK_CROSS_TRACKS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cross-Camera Tracking</h1>
          <p className="text-slate-400">Multi-camera appearance correlation and trajectory</p>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          SIMULATION MODE
        </Badge>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-start space-x-3 text-blue-400">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Tracking limitations apply.</p>
          <p className="text-blue-400/80 mt-1">This feature uses appearance-based correlation (clothing, color, size) across non-overlapping camera views. It does not use biometric identification. Tracking may break in dense crowds or visually similar subjects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Active Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CROSS_TRACKS.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.id} ({t.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Object Type</span>
                  <span className="capitalize text-white">{track.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">First Seen</span>
                  <span className="text-white">{track.firstSeen}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Last Seen</span>
                  <span className="text-white">{track.lastSeen}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Current Zone</span>
                  <span className="text-white">{track.currentZone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Movement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pt-8 pb-4">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800"></div>
                
                <div className="space-y-8">
                  {track.cameras.map((cam, idx) => (
                    <div key={idx} className="relative flex items-start ml-6">
                      <div className={`absolute -left-[33px] w-4 h-4 rounded-full border-2 border-slate-900 ${idx === track.cameras.length - 1 ? 'bg-cyan-500' : 'bg-slate-500'}`}></div>
                      <div className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-white flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                            {cam.name} ({cam.id})
                          </h4>
                          <span className="text-sm text-slate-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {cam.time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Duration in view: {cam.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
