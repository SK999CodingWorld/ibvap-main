import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, Filter, Users, Car, Crosshair, ArrowRight, ArrowUpRight, 
  ArrowDownRight, ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft, ArrowUp, 
  Activity, ShieldAlert, Zap 
} from 'lucide-react';

interface TrackDetection {
  id: string;
  track_id?: number;
  type: string;
  label?: string;
  camera: string;
  direction: string;
  speed: number;
  zone: string;
  confidence: number;
  certainty: string;
  time: string;
}

interface TrackingStats {
  total_people: number;
  total_vehicles: number;
  active_tracks: number;
  avg_confidence: number;
}

const getDirectionIcon = (dir: string) => {
  switch (dir?.toUpperCase()) {
    case 'N': return <ArrowUp className="w-4 h-4 text-cyan-400" />;
    case 'NE': return <ArrowUpRight className="w-4 h-4 text-cyan-400" />;
    case 'E': return <ArrowRight className="w-4 h-4 text-cyan-400" />;
    case 'SE': return <ArrowDownRight className="w-4 h-4 text-cyan-400" />;
    case 'S': return <ArrowDown className="w-4 h-4 text-cyan-400" />;
    case 'SW': return <ArrowDownLeft className="w-4 h-4 text-cyan-400" />;
    case 'W': return <ArrowLeft className="w-4 h-4 text-cyan-400" />;
    case 'NW': return <ArrowUpLeft className="w-4 h-4 text-cyan-400" />;
    default: return <ArrowUp className="w-4 h-4 text-slate-400" />;
  }
};

const getCertaintyColor = (certainty: string) => {
  switch (certainty?.toLowerCase()) {
    case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'probable': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'uncertain': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

export const PeopleObjects = () => {
  const [detections, setDetections] = useState<TrackDetection[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    total_people: 18,
    total_vehicles: 8,
    active_tracks: 3,
    avg_confidence: 94.5
  });
  const [isLive, setIsLive] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrackingData = async () => {
    try {
      // 1. Fetch Real-Time Detection Feed
      const feedRes = await fetch('/api/tracks/feed');
      if (feedRes.ok) {
        const feedJson = await feedRes.json();
        if (feedJson.data && Array.isArray(feedJson.data) && feedJson.data.length > 0) {
          setDetections(feedJson.data);
          setIsLive(true);
        }
      }

      // 2. Fetch Live Tracking KPI Stats
      const statsRes = await fetch('/api/tracks/stats');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.stats) {
          setStats(statsJson.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching live tracking data:", err);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 1500);
    return () => clearInterval(interval);
  }, []);

  const filteredDetections = detections.filter(d => {
    if (filterType !== 'all') {
      if (filterType === 'person' && !d.type.toLowerCase().includes('person')) return false;
      if (filterType === 'vehicle' && !['car', 'truck', 'bus', 'motorcycle', 'vehicle'].some(v => d.type.toLowerCase().includes(v))) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const idMatch = d.id?.toLowerCase().includes(term);
      const camMatch = d.camera?.toLowerCase().includes(term);
      const zoneMatch = d.zone?.toLowerCase().includes(term);
      const labelMatch = d.label?.toLowerCase().includes(term);
      if (!idMatch && !camMatch && !zoneMatch && !labelMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Crosshair className="text-cyan-400" />
            Subject & Vehicle Tracking Feed
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time multi-class tracking, velocity estimation, and zone classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-mono text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE VISION FEED ACTIVE ({stats.active_tracks} IN-FRAME)
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono text-xs">
              CONNECTING TO STREAM...
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase">Total People Tracked</CardTitle>
            <Users className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{stats.total_people}</div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Persisted track identities</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase">Total Vehicles</CardTitle>
            <Car className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{stats.total_vehicles}</div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Automated ANPR logged</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase">Active In-Frame Tracks</CardTitle>
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.active_tracks}</div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time active bounding boxes</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono font-medium text-slate-400 uppercase">Avg Model Confidence</CardTitle>
            <Activity className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{stats.avg_confidence}%</div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ByteTrack Kalman consistency</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Detection Feed Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-mono font-medium text-white flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                Live Detection Feed
              </CardTitle>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Streaming live confirmed tracks with dynamic velocity vectors and zone state
              </p>
            </div>
            
            <div className="flex flex-wrap items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search ID, camera, or zone..."
                  className="pl-9 w-[240px] bg-slate-950 border-slate-800 font-mono text-xs text-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 font-mono text-xs text-slate-200">
                  <Filter className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 font-mono text-xs">
                  <SelectItem value="all">All Objects</SelectItem>
                  <SelectItem value="person">People Only</SelectItem>
                  <SelectItem value="vehicle">Vehicles Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent font-mono text-xs">
                <TableHead>Tracking ID</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Camera</TableHead>
                <TableHead>Location Zone</TableHead>
                <TableHead>Trajectory Vector</TableHead>
                <TableHead>Speed (Est.)</TableHead>
                <TableHead>Certainty</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetections.map((det) => (
                <TableRow key={`${det.id}-${det.time}`} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer font-mono text-xs">
                  <TableCell className="font-bold text-white font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {det.id}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {det.type.toLowerCase().includes('person') ? (
                        <Users className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Car className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="capitalize text-slate-200 font-semibold">{det.label || det.type}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-300">{det.camera}</TableCell>
                  
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[11px] ${det.zone.includes('Red') ? 'bg-red-950/80 text-red-400 border border-red-500/30' : 'bg-slate-950 text-slate-300 border border-slate-800'}`}>
                      {det.zone}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1.5">
                      {getDirectionIcon(det.direction)}
                      <span className="text-slate-300 font-bold">{det.direction}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-amber-400 font-semibold">
                    {det.speed ? `${det.speed} ${det.type.includes('person') ? 'm/s' : 'km/h'}` : '0.0 m/s'}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0.5 ${getCertaintyColor(det.certainty)}`}>
                      {det.certainty?.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${det.confidence > 90 ? 'bg-emerald-400' : det.confidence > 75 ? 'bg-blue-400' : 'bg-amber-400'}`} 
                          style={{ width: `${det.confidence}%` }} 
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">{det.confidence}%</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-400">{det.time}</TableCell>
                </TableRow>
              ))}

              {filteredDetections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 font-mono text-xs">
                    No active detections found matching current filters.
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
