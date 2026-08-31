import { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SimulationBanner } from '../components/ui/SimulationBanner';
import { 
  Activity, Users, Car, AlertTriangle, Clock, 
  Target, Shield, Camera, Cpu, Eye, Video
} from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const mockHourlyData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  people: Math.floor(Math.random() * 50) + 10,
  vehicles: Math.floor(Math.random() * 30) + 5,
  alerts: Math.floor(Math.random() * 10),
}));

const mockAlertsBySeverity = [
  { name: 'Critical', value: 12 },
  { name: 'High', value: 35 },
  { name: 'Medium', value: 89 },
  { name: 'Low', value: 145 },
];

const mockEventsByCamera = [
  { name: 'CAM-N-01', events: 120 },
  { name: 'CAM-N-02', events: 95 },
  { name: 'CAM-E-01', events: 150 },
  { name: 'CAM-W-01', events: 80 },
  { name: 'CAM-S-01', events: 60 },
];

const mockIntrusions = Array.from({ length: 14 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  intrusions: Math.floor(Math.random() * 20),
  loitering: Math.floor(Math.random() * 40),
  crossings: Math.floor(Math.random() * 15),
}));

const mockVehiclesByType = [
  { name: 'Car', value: 450 },
  { name: 'Truck', value: 120 },
  { name: 'Motorcycle', value: 85 },
  { name: 'Bus', value: 30 },
];

const mockAnprConfidence = [
  { range: '95-100%', count: 320 },
  { range: '90-94%', count: 150 },
  { range: '85-89%', count: 80 },
  { range: '80-84%', count: 30 },
  { range: '<80%', count: 15 },
];

const mockCameraHealth = [
  { name: 'CAM-N-01', uptime: 99.9, fps: 30 },
  { name: 'CAM-N-02', uptime: 98.5, fps: 28 },
  { name: 'CAM-E-01', uptime: 99.2, fps: 30 },
  { name: 'CAM-W-01', uptime: 100, fps: 30 },
  { name: 'CAM-S-01', uptime: 95.0, fps: 24 },
];

const mockAiPerformance = Array.from({ length: 20 }).map((_, i) => ({
  time: `T-${20-i}m`,
  fps: 28 + Math.random() * 4,
  latency: 35 + Math.random() * 15,
}));

export const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('surveillance');

  const tabs = [
    { id: 'surveillance', label: 'Surveillance', icon: <Eye className="w-4 h-4 mr-2" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4 mr-2" /> },
    { id: 'anpr', label: 'ANPR', icon: <Car className="w-4 h-4 mr-2" /> },
    { id: 'camera', label: 'Camera', icon: <Camera className="w-4 h-4 mr-2" /> },
    { id: 'ai', label: 'AI Performance', icon: <Cpu className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-950 text-slate-200">
      <SimulationBanner />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Analytics</h1>
          <p className="text-slate-400 text-sm">Comprehensive performance and detection metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select className="bg-slate-900 border border-slate-700 text-sm rounded-md px-3 py-2 text-slate-300">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Detections</p>
              <h3 className="text-2xl font-bold text-white">14,285</h3>
              <p className="text-xs text-green-500">+12% vs last period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Alerts</p>
              <h3 className="text-2xl font-bold text-white">281</h3>
              <p className="text-xs text-red-500">+5% vs last period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Avg AI Confidence</p>
              <h3 className="text-2xl font-bold text-white">94.2%</h3>
              <p className="text-xs text-green-500">+1.2% vs last period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Avg Alert Latency</p>
              <h3 className="text-2xl font-bold text-white">0.8s</h3>
              <p className="text-xs text-slate-400">Stable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-slate-800">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'surveillance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Detections Per Hour</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="people" name="People" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vehicles" name="Vehicles" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Alerts by Severity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAlertsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" /> {/* Critical */}
                    <Cell fill="#f59e0b" /> {/* High */}
                    <Cell fill="#3b82f6" /> {/* Medium */}
                    <Cell fill="#64748b" /> {/* Low */}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-200">Events by Camera</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockEventsByCamera} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="events" name="Total Events" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-200">Intrusion & Loitering Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockIntrusions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Legend />
                  <Area type="monotone" dataKey="intrusions" name="Intrusions" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="loitering" name="Loitering" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Restricted Zone Crossings</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockIntrusions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="crossings" name="Crossings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Night Events Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockIntrusions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="intrusions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'anpr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-200">Reads per Hour</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="vehicles" name="Reads" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Confidence Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnprConfidence} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="range" type="category" stroke="#64748b" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="count" name="Count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Vehicles by Type</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockVehiclesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockVehiclesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-200">Camera Uptime & FPS</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockCameraHealth} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="uptime" name="Uptime %" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="fps" name="FPS" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-200">Detection FPS over time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockAiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[20, 35]} stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="fps" name="FPS" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Inference Latency (ms)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockAiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[20, 60]} stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="latency" name="Latency (ms)" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 bg-slate-800/50 uppercase">
                    <tr>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Avg Latency</th>
                      <th className="px-4 py-3">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3 font-medium text-white">MockDetector</td>
                      <td className="px-4 py-3 text-slate-400">1.0.4</td>
                      <td className="px-4 py-3 text-emerald-400">32ms</td>
                      <td className="px-4 py-3">94.2%</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3 font-medium text-white">MockTracker</td>
                      <td className="px-4 py-3 text-slate-400">2.1.0</td>
                      <td className="px-4 py-3 text-emerald-400">12ms</td>
                      <td className="px-4 py-3">89.5%</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3 font-medium text-white">MockOCR</td>
                      <td className="px-4 py-3 text-slate-400">1.5.2</td>
                      <td className="px-4 py-3 text-amber-400">85ms</td>
                      <td className="px-4 py-3">91.8%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-white">MockFace</td>
                      <td className="px-4 py-3 text-slate-400">1.0.0</td>
                      <td className="px-4 py-3 text-amber-400">45ms</td>
                      <td className="px-4 py-3">88.4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
