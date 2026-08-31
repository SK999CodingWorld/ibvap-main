import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Map, AlertTriangle, Clock, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

const MOCK_ZONES = [
  { id: '1', name: 'Restricted Zone Alpha', camera: 'CAM-01', type: 'Polygon', status: 'active', severity: 'critical', schedule: '24/7', violations: 12 },
  { id: '2', name: 'Perimeter Fence East', camera: 'CAM-04', type: 'Line Crossing', status: 'active', severity: 'high', schedule: '22:00 - 05:00', violations: 3 },
  { id: '3', name: 'Checkpoint Entry Line', camera: 'CAM-05', type: 'Line Crossing', status: 'inactive', severity: 'medium', schedule: '24/7', violations: 0 },
  { id: '4', name: 'Server Room Door', camera: 'CAM-03', type: 'Rectangle', status: 'active', severity: 'critical', schedule: '24/7', violations: 1 },
  { id: '5', name: 'Parking Loading Bay', camera: 'CAM-06', type: 'Polygon', status: 'active', severity: 'low', schedule: '18:00 - 08:00', violations: 5 }
];

export const VirtualFences = () => {
  const [zones, setZones] = useState(MOCK_ZONES);

  const toggleZone = (id: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, status: z.status === 'active' ? 'inactive' : 'active' } : z));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Virtual Fences</h1>
          <p className="text-slate-400">Intrusion detection zones and tripwires</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            SIMULATION MODE
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => alert('Add zone modal')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Zone
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <Card key={zone.id} className="bg-slate-900 border-slate-800 flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-medium text-white">{zone.name}</CardTitle>
                  <p className="text-sm text-slate-400 flex items-center mt-1">
                    <Map className="w-3 h-3 mr-1" />
                    {zone.camera}
                  </p>
                </div>
                <Switch 
                  checked={zone.status === 'active'}
                  onCheckedChange={() => toggleZone(zone.id)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="aspect-video bg-slate-950 rounded-md border border-slate-800 relative overflow-hidden flex items-center justify-center">
                <p className="text-slate-600 text-sm">Camera Feed Placeholder</p>
                {/* Zone overlay simulation */}
                {zone.type === 'Polygon' && (
                  <div className="absolute inset-4 border-2 border-red-500/50 bg-red-500/10 rounded-sm"></div>
                )}
                {zone.type === 'Rectangle' && (
                  <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-blue-500/50 bg-blue-500/10"></div>
                )}
                {zone.type === 'Line Crossing' && (
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <p className="text-slate-500 text-xs mb-1">Type</p>
                  <p className="text-white font-medium">{zone.type}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <p className="text-slate-500 text-xs mb-1">Violations</p>
                  <p className="text-white font-medium flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                    {zone.violations}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-400">
                  <Clock className="w-4 h-4 mr-2" />
                  {zone.schedule}
                </div>
                <Badge variant="outline" className={getSeverityColor(zone.severity)}>
                  {zone.severity.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
              <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white" onClick={() => alert('Edit zone')}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => alert('Delete zone')}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
