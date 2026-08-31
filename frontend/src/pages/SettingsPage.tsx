import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SimulationBanner } from '../components/ui/SimulationBanner';
import { 
  Settings, Cpu, Bell, Sliders, Globe, Save, AlertCircle, Eye, Moon, MonitorPlay
} from 'lucide-react';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4 mr-2" /> },
    { id: 'ai', label: 'AI Configuration', icon: <Cpu className="w-4 h-4 mr-2" /> },
    { id: 'thresholds', label: 'Thresholds', icon: <Sliders className="w-4 h-4 mr-2" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 mr-2" /> },
    { id: 'environment', label: 'Environment', icon: <Globe className="w-4 h-4 mr-2" /> },
  ];

  const handleToggle = (e: any) => {
    setHasChanges(true);
  };

  const handleChange = (e: any) => {
    setHasChanges(true);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-950 text-slate-200">
      <SimulationBanner />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 text-sm">Configure platform behavior and AI parameters</p>
        </div>
        
        <Button 
          disabled={!hasChanges}
          className={`${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          onClick={() => setHasChanges(false)}
        >
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="border-b border-slate-800">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl">
        {activeTab === 'general' && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">System Name</label>
                  <input 
                    type="text" 
                    defaultValue="IBVAP - Intelligent Border Video Analytics Platform" 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Theme Preference</label>
                  <select 
                    defaultValue="dark"
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="dark">Command Center Dark (Default)</option>
                    <option value="light">High Contrast Light</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Language</label>
                  <select 
                    defaultValue="en"
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Timezone</label>
                  <select 
                    defaultValue="ist"
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="ist">Asia/Kolkata (IST)</option>
                    <option value="utc">UTC</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-medium text-slate-200 mb-4">Simulation & Demo Mode</h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 mb-4">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      <MonitorPlay className="w-4 h-4 text-blue-400" /> Enable Demo Mode
                    </h4>
                    <p className="text-sm text-slate-400">Uses mock services and simulated data for demonstration purposes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={handleToggle} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-2 max-w-md">
                  <label className="text-sm font-medium text-slate-300 flex justify-between">
                    <span>Simulation Speed</span>
                    <span className="text-blue-400">1x</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="10" defaultValue="1" 
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Real-time</span>
                    <span>10x Fast-forward</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200">AI Module Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Face Detection', desc: 'Detect and extract facial features from video streams', defaultChecked: true },
                  { name: 'ANPR (License Plate)', desc: 'Automatic number plate recognition', defaultChecked: true },
                  { name: 'Night Mode Auto-Detection', desc: 'Automatically switch models based on lighting', defaultChecked: true },
                ].map((mod, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                    <div>
                      <h4 className="font-medium text-sm text-slate-200">{mod.name}</h4>
                      <p className="text-xs text-slate-400">{mod.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={mod.defaultChecked} onChange={handleToggle} />
                      <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded border border-amber-500/20 mt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm text-amber-500">Authorized Personnel Identification</h4>
                      <p className="text-xs text-amber-400/80">Cross-reference faces with authorized personnel database. High privacy impact.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" onChange={handleToggle} />
                    <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200">Model Selection & Abstraction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 max-w-md">
                  <label className="text-sm font-medium text-slate-300 flex justify-between">
                    <span>Base Detection Model</span>
                  </label>
                  <select 
                    defaultValue="mock"
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="mock">MockDetector (Simulation)</option>
                    <option value="yolo8">YOLOv8 (TensorRT)</option>
                    <option value="custom">Custom Thermal Model</option>
                  </select>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-400">
                  <div className="text-emerald-400 mb-2">/* Active Pipeline Interfaces */</div>
                  <div className="grid grid-cols-[200px_auto] gap-2">
                    <span className="text-blue-400">IDetector</span><span>→ MockDetector</span>
                    <span className="text-blue-400">ITracker</span><span>→ MockTracker</span>
                    <span className="text-blue-400">IOCR</span><span>→ MockOCR</span>
                    <span className="text-blue-400">IFaceDetector</span><span>→ MockFace</span>
                    <span className="text-blue-400">IBehaviorAnalyzer</span><span>→ MockBehavior</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'thresholds' && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Analytics Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Global AI Confidence Threshold</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" max="100" defaultValue="70" 
                      onChange={handleChange}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-blue-400 font-mono font-bold min-w-[3rem]">70%</span>
                  </div>
                  <p className="text-xs text-slate-500">Detections below this confidence level will be discarded to reduce false positives.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Loitering Duration (Seconds)</label>
                  <input type="number" defaultValue="30" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Alert Deduplication Window (Sec)</label>
                  <input type="number" defaultValue="15" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tracking Persistence (Frames)</label>
                  <input type="number" defaultValue="60" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">High Speed Alert Threshold (km/h)</label>
                  <input type="number" defaultValue="80" onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-medium text-slate-200 mb-4">Risk Score Severity Thresholds</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-red-500">Critical</span>
                    <input type="number" defaultValue="80" className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-center text-slate-200" onChange={handleChange} />
                    <span className="text-sm text-slate-400">to 100</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-amber-500">High</span>
                    <input type="number" defaultValue="60" className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-center text-slate-200" onChange={handleChange} />
                    <span className="text-sm text-slate-400">to 79</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-blue-500">Medium</span>
                    <input type="number" defaultValue="30" className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm text-center text-slate-200" onChange={handleChange} />
                    <span className="text-sm text-slate-400">to 59</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Alert Routing & Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { name: 'Email', defaultChecked: true },
                  { name: 'SMS', defaultChecked: false },
                  { name: 'Push (Browser)', defaultChecked: true },
                ].map((method, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="font-medium text-sm text-slate-200">{method.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={method.defaultChecked} onChange={handleToggle} />
                      <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-medium text-slate-200 mb-2">Notification Categories</h3>
              <div className="space-y-2">
                {[
                  { name: 'Critical Alerts', desc: 'Intrusions, SOS, Major Failures', color: 'text-red-500', checked: true },
                  { name: 'High Alerts', desc: 'Loitering, Unauthorized Vehicles', color: 'text-amber-500', checked: true },
                  { name: 'Medium Alerts', desc: 'Crowd Gathering, Night Detections', color: 'text-blue-500', checked: false },
                  { name: 'Low Alerts', desc: 'Informational events, Normal activity', color: 'text-slate-400', checked: false },
                  { name: 'System Alerts', desc: 'Camera offline, Edge node degraded', color: 'text-purple-400', checked: true },
                ].map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                    <div>
                      <h4 className={`font-medium text-sm ${cat.color}`}>{cat.name}</h4>
                      <p className="text-xs text-slate-400">{cat.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={cat.checked} onChange={handleToggle} />
                      <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'environment' && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">Environment & Infrastructure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-400" /> Weather & Environment Auto-Detection
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={handleToggle} />
                    <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-center">
                    <span className="block text-xs text-slate-400 mb-1">Time of Day</span>
                    <span className="font-medium text-blue-400">Night Mode</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-center">
                    <span className="block text-xs text-slate-400 mb-1">Weather</span>
                    <span className="font-medium text-slate-200">Clear</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-center">
                    <span className="block text-xs text-slate-400 mb-1">Visibility</span>
                    <span className="font-medium text-emerald-400">Good (&gt;10km)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-200 mb-2">Environment Variables (Read-Only)</h3>
                <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex"><span className="text-slate-500 w-32">NODE_ENV:</span><span className="text-emerald-400">development</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">API_URL:</span><span className="text-slate-300">http://localhost:8000/api</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">WS_URL:</span><span className="text-slate-300">ws://localhost:8000/ws</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">MOCK_SERVICES:</span><span className="text-blue-400">true</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">DB_HOST:</span><span className="text-slate-300">localhost</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">DB_PASSWORD:</span><span className="text-slate-500">********</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">JWT_SECRET:</span><span className="text-slate-500">********</span></div>
                  <div className="flex"><span className="text-slate-500 w-32">EDGE_MODE:</span><span className="text-blue-400">true</span></div>
                </div>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
