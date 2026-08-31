import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SimulationBanner } from '../components/ui/SimulationBanner';
import { 
  Server, Cpu, Database, Network, HardDrive, 
  Activity, ArrowDownToLine, Signal, SignalZero, WifiOff, RefreshCw
} from 'lucide-react';

const CircularProgress = ({ value, colorClass, size = 80, strokeWidth = 8 }: { value: number, colorClass: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          stroke="currentColor" strokeWidth={strokeWidth} 
          fill="transparent" className="text-slate-800" 
        />
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          stroke="currentColor" strokeWidth={strokeWidth} 
          fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} 
          className={`transition-all duration-1000 ease-in-out ${colorClass}`} 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{value}%</span>
      </div>
    </div>
  );
};

export const SystemHealth = () => {
  const [edgeNodes, setEdgeNodes] = useState([
    { id: 'EDG-N-01', status: 'online', pending: 0 },
    { id: 'EDG-N-02', status: 'online', pending: 0 },
    { id: 'EDG-E-01', status: 'online', pending: 0 },
    { id: 'EDG-E-02', status: 'degraded', pending: 15 },
    { id: 'EDG-S-01', status: 'offline', pending: 245 },
    { id: 'EDG-S-02', status: 'online', pending: 0 },
    { id: 'EDG-W-01', status: 'offline', pending: 189 },
    { id: 'EDG-W-02', status: 'online', pending: 0 },
  ]);

  const updateNodeStatus = (id: string, status: string) => {
    setEdgeNodes(nodes => nodes.map(n => {
      if (n.id === id) {
        return { ...n, status, pending: status === 'online' ? 0 : status === 'offline' ? n.pending + 50 : n.pending + 10 };
      }
      return n;
    }));
  };

  const syncNode = (id: string) => {
    setEdgeNodes(nodes => nodes.map(n => n.id === id ? { ...n, pending: 0, status: 'online' } : n));
  };

  const isDegraded = edgeNodes.some(n => n.status !== 'online');
  const systemStatus = isDegraded ? 'DEGRADED' : 'HEALTHY';
  const systemStatusColor = isDegraded ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-950 text-slate-200">
      <SimulationBanner />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Infrastructure Health</h1>
          <p className="text-slate-400 text-sm">System performance and edge node status</p>
        </div>
        
        <div className={`px-4 py-2 rounded-full font-bold flex items-center border border-current ${systemStatusColor}`}>
          <Activity className="w-5 h-5 mr-2" />
          SYSTEM HEALTH: {systemStatus}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <CircularProgress value={42} colorClass="text-emerald-500" size={70} />
            <div className="flex items-center gap-1 text-slate-300">
              <Cpu className="w-4 h-4" /> CPU
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <CircularProgress value={67} colorClass="text-amber-500" size={70} />
            <div className="flex items-center gap-1 text-slate-300">
              <Cpu className="w-4 h-4" /> GPU
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <CircularProgress value={58} colorClass="text-emerald-500" size={70} />
            <div className="flex items-center gap-1 text-slate-300">
              <Database className="w-4 h-4" /> RAM
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <CircularProgress value={34} colorClass="text-emerald-500" size={70} />
            <div className="flex items-center gap-1 text-slate-300">
              <HardDrive className="w-4 h-4" /> Disk
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
            <h3 className="text-3xl font-bold text-blue-400">38</h3>
            <span className="text-xs text-slate-400">Mbps</span>
            <div className="flex items-center gap-1 text-slate-300 mt-1 text-sm">
              <Network className="w-4 h-4" /> Network
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
            <h3 className="text-3xl font-bold text-emerald-400">28</h3>
            <span className="text-xs text-slate-400">FPS / 35ms</span>
            <div className="flex items-center gap-1 text-slate-300 mt-1 text-sm">
              <Activity className="w-4 h-4" /> AI Engine
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base">Services Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-800/50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Uptime</th>
                    <th className="px-4 py-3 rounded-tr-lg">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'API Gateway', status: 'Healthy', uptime: '99.9%', latency: '12ms' },
                    { name: 'PostgreSQL', status: 'Healthy', uptime: '99.9%', latency: '8ms' },
                    { name: 'Redis Cache', status: 'Healthy', uptime: '99.8%', latency: '2ms' },
                    { name: 'AI Engine', status: 'Healthy', uptime: '99.7%', latency: '35ms' },
                    { name: 'Camera Gateway', status: 'Healthy', uptime: '99.5%', latency: '142ms' },
                    { name: 'WebSocket', status: 'Healthy', uptime: '99.9%', latency: '5ms' }
                  ].map((service, i) => (
                    <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{service.name}</td>
                      <td className="px-4 py-3 text-emerald-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {service.status}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{service.uptime}</td>
                      <td className="px-4 py-3 text-slate-400">{service.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base">AI Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-800/50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Model</th>
                    <th className="px-4 py-3">FPS</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Conf.</th>
                    <th className="px-4 py-3">GPU</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'MockDetector', fps: 28, latency: '35ms', conf: '91%', gpu: '42%', status: 'Active' },
                    { name: 'MockTracker', fps: 28, latency: '12ms', conf: '89%', gpu: '15%', status: 'Active' },
                    { name: 'MockOCR', fps: 15, latency: '85ms', conf: '94%', gpu: '10%', status: 'Active' },
                    { name: 'MockFace', fps: 20, latency: '45ms', conf: '88%', gpu: '8%', status: 'Active' }
                  ].map((model, i) => (
                    <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{model.name}</td>
                      <td className="px-4 py-3 text-blue-400">{model.fps}</td>
                      <td className="px-4 py-3 text-slate-400">{model.latency}</td>
                      <td className="px-4 py-3 text-emerald-400">{model.conf}</td>
                      <td className="px-4 py-3 text-amber-400">{model.gpu}</td>
                      <td className="px-4 py-3 text-emerald-400 text-xs">
                        <span className="px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{model.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-white">Edge Node Management</h2>
          <div className="text-sm bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg flex items-center gap-4">
            <span className="font-semibold text-white">Bandwidth Savings: 91%</span>
            <span className="text-slate-400">Traditional: 420 Mbps</span>
            <span className="text-blue-400">IBVAP: 38 Mbps</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {edgeNodes.map(node => (
            <Card key={node.id} className={`bg-slate-900 border ${
              node.status === 'online' ? 'border-slate-800' : 
              node.status === 'degraded' ? 'border-amber-500/50' : 'border-red-500/50'
            }`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      {node.id}
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      node.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' :
                      node.status === 'degraded' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {node.status.toUpperCase()}
                    </span>
                  </div>
                  {node.pending > 0 && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Pending Sync</span>
                      <span className="text-sm font-bold text-amber-500">{node.pending} events</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg text-sm border border-slate-800">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'online')}
                      className={`p-1.5 rounded ${node.status === 'online' ? 'bg-emerald-500/20 text-emerald-500' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'}`}
                      title="Set Online"
                    >
                      <Signal className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'degraded')}
                      className={`p-1.5 rounded ${node.status === 'degraded' ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
                      title="Set Degraded"
                    >
                      <SignalZero className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'offline')}
                      className={`p-1.5 rounded ${node.status === 'offline' ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'}`}
                      title="Set Offline"
                    >
                      <WifiOff className="w-4 h-4" />
                    </button>
                  </div>
                  {node.pending > 0 && node.status === 'online' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500/50 text-blue-400" onClick={() => syncNode(node.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Sync
                    </Button>
                  )}
                  {node.status === 'offline' && (
                    <span className="text-xs text-red-400 flex items-center">
                      <ArrowDownToLine className="w-3 h-3 mr-1" /> AI processing locally
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
