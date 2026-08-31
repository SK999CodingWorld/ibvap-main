import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Search, Filter, Users, Car, Crosshair, ArrowRight, ArrowUpRight, ArrowDownRight, ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft, ArrowUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Mock Data
const MOCK_DETECTIONS = [
  { id: 'P-097', type: 'person', camera: 'CAM-01', direction: 'N', speed: 1.2, zone: 'Entry Lobby', confidence: 95, certainty: 'confirmed', time: '10:42:15' },
  { id: 'P-098', type: 'person', camera: 'CAM-02', direction: 'NE', speed: 1.4, zone: 'Corridor A', confidence: 92, certainty: 'confirmed', time: '10:42:10' },
  { id: 'P-099', type: 'person', camera: 'CAM-01', direction: 'S', speed: 0.8, zone: 'Entry Lobby', confidence: 85, certainty: 'probable', time: '10:41:55' },
  { id: 'V-018', type: 'vehicle', camera: 'CAM-05', direction: 'E', speed: 15.5, zone: 'Main Gate', confidence: 98, certainty: 'confirmed', time: '10:41:30' },
  { id: 'P-100', type: 'person', camera: 'CAM-03', direction: 'W', speed: 1.1, zone: 'Cafeteria', confidence: 75, certainty: 'uncertain', time: '10:41:22' },
  { id: 'V-019', type: 'vehicle', camera: 'CAM-06', direction: 'W', speed: 12.0, zone: 'Parking A', confidence: 96, certainty: 'confirmed', time: '10:40:45' },
  { id: 'P-101', type: 'person', camera: 'CAM-02', direction: 'NW', speed: 1.3, zone: 'Corridor A', confidence: 90, certainty: 'confirmed', time: '10:40:15' },
  { id: 'V-020', type: 'vehicle', camera: 'CAM-05', direction: 'E', speed: 14.2, zone: 'Main Gate', confidence: 94, certainty: 'confirmed', time: '10:39:50' },
  { id: 'P-102', type: 'person', camera: 'CAM-04', direction: 'S', speed: 0.0, zone: 'Server Room', confidence: 60, certainty: 'unknown', time: '10:39:10' },
  { id: 'P-103', type: 'person', camera: 'CAM-01', direction: 'N', speed: 1.5, zone: 'Entry Lobby', confidence: 91, certainty: 'confirmed', time: '10:38:44' },
  { id: 'V-021', type: 'vehicle', camera: 'CAM-06', direction: 'E', speed: 10.5, zone: 'Parking B', confidence: 88, certainty: 'probable', time: '10:38:20' },
  { id: 'P-104', type: 'person', camera: 'CAM-03', direction: 'E', speed: 1.2, zone: 'Cafeteria', confidence: 97, certainty: 'confirmed', time: '10:37:55' },
  { id: 'P-105', type: 'person', camera: 'CAM-02', direction: 'SE', speed: 1.0, zone: 'Corridor B', confidence: 82, certainty: 'probable', time: '10:37:15' },
  { id: 'V-022', type: 'vehicle', camera: 'CAM-05', direction: 'W', speed: 16.0, zone: 'Main Gate', confidence: 99, certainty: 'confirmed', time: '10:36:40' },
  { id: 'P-106', type: 'person', camera: 'CAM-04', direction: 'N', speed: 1.4, zone: 'Server Room', confidence: 89, certainty: 'confirmed', time: '10:36:10' },
];

const getDirectionIcon = (dir: string) => {
  switch (dir) {
    case 'N': return <ArrowUp className="w-4 h-4" />;
    case 'NE': return <ArrowUpRight className="w-4 h-4" />;
    case 'E': return <ArrowRight className="w-4 h-4" />;
    case 'SE': return <ArrowDownRight className="w-4 h-4" />;
    case 'S': return <ArrowDown className="w-4 h-4" />;
    case 'SW': return <ArrowDownLeft className="w-4 h-4" />;
    case 'W': return <ArrowLeft className="w-4 h-4" />;
    case 'NW': return <ArrowUpLeft className="w-4 h-4" />;
    default: return <ArrowUp className="w-4 h-4" />;
  }
};

const getCertaintyColor = (certainty: string) => {
  switch (certainty) {
    case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'probable': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'uncertain': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'unknown': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

export const PeopleObjects = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDetections = MOCK_DETECTIONS.filter(d => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (searchTerm && !d.id.toLowerCase().includes(searchTerm.toLowerCase()) && !d.camera.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Subject Tracking</h1>
          <p className="text-slate-400">Real-time object detection and classification</p>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          SIMULATION MODE
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total People</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">245</div>
            <p className="text-xs text-slate-500">Active today</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Vehicles</CardTitle>
            <Car className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">82</div>
            <p className="text-xs text-slate-500">Active today</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Tracks</CardTitle>
            <Crosshair className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">15</div>
            <p className="text-xs text-slate-500">Currently in frame</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Confidence</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">92.4%</div>
            <p className="text-xs text-slate-500">System accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Detection Feed</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search ID or Camera..."
                  className="pl-9 w-[250px] bg-slate-950 border-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px] bg-slate-950 border-slate-800">
                  <Filter className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="person">People</SelectItem>
                  <SelectItem value="vehicle">Vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead>Tracking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Camera</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Certainty</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetections.map((det) => (
                <TableRow key={det.id} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer">
                  <TableCell className="font-medium text-white">{det.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {det.type === 'person' ? <Users className="w-4 h-4 text-blue-500" /> : <Car className="w-4 h-4 text-emerald-500" />}
                      <span className="capitalize">{det.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{det.camera}</TableCell>
                  <TableCell>{det.zone}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getDirectionIcon(det.direction)}
                      <span>{det.direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCertaintyColor(det.certainty)}>
                      {det.certainty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${det.confidence > 90 ? 'bg-emerald-500' : det.confidence > 80 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                          style={{ width: `${det.confidence}%` }} 
                        />
                      </div>
                      <span className="text-xs text-slate-400">{det.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{det.time}</TableCell>
                </TableRow>
              ))}
              {filteredDetections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No detections found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
