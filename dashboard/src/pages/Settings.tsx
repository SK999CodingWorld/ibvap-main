import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useHealth } from '@/hooks/useData'
import { Save, Loader2, Server, Database, Video, Shield, HardDrive, Cpu, MemoryStick } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Settings() {
  const { health } = useHealth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const settings = {
    detection: {
      model: 'yolov8n.pt',
      confidence: 0.35,
      iou: 0.45,
      device: 'auto',
      half: false,
      imgsz: 640,
    },
    tracking: {
      tracker: 'botsort',
      buffer: 30,
      matchThresh: 0.8,
    },
    alerts: {
      cooldown: 5,
      maxHistory: 1000,
    },
    recording: {
      enabled: true,
      segmentDuration: 300,
      retentionDays: 30,
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
    },
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    // In a real app, this would POST to /api/settings
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure system parameters</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-green-400 text-sm">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary">
                <option value="yolov8n.pt">YOLOv8 Nano (fastest)</option>
                <option value="yolov8s.pt">YOLOv8 Small</option>
                <option value="yolov8m.pt">YOLOv8 Medium</option>
                <option value="yolov8l.pt">YOLOv8 Large</option>
                <option value="yolov8x.pt">YOLOv8 XLarge (most accurate)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Confidence Threshold</label>
                <input type="range" min="0.1" max="0.9" step="0.05" defaultValue={0.35} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">0.35</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IoU Threshold</label>
                <input type="range" min="0.3" max="0.7" step="0.05" defaultValue={0.45} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">0.45</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary">
                  <option value="auto">Auto</option>
                  <option value="cpu">CPU</option>
                  <option value="cuda">CUDA (GPU)</option>
                  <option value="mps">MPS (Apple Silicon)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image Size</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary">
                  <option value="320">320</option>
                  <option value="640" selected>640</option>
                  <option value="1280">1280</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm">FP16 Half Precision</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5" />
              Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tracker</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary">
                <option value="botsort">BoT-SORT (recommended)</option>
                <option value="bytetrack">ByteTrack</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Track Buffer (frames)</label>
                <input type="number" defaultValue={30} min="10" max="100" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Match Threshold</label>
                <input type="range" min="0.5" max="0.95" step="0.05" defaultValue={0.8} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">0.80</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cooldown (seconds)</label>
                <input type="number" defaultValue={5} min="1" max="300" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max History</label>
                <input type="number" defaultValue={1000} min="100" max="10000" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={true} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm">Enable Email Notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm">Webhook Notifications</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Recording Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={true} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm">Enable Recording</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Segment Duration (seconds)</label>
                <input type="number" defaultValue={300} min="60" max="3600" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Retention (days)</label>
                <input type="number" defaultValue={30} min="1" max="365" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redis/Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database & Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Redis Host</label>
                <input type="text" defaultValue="localhost" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Redis Port</label>
                <input type="number" defaultValue={6379} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Redis DB</label>
                <input type="number" defaultValue={0} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PostgreSQL Connection</label>
              <input type="text" defaultValue="postgresql://ibvap:ibvap_secret@localhost:5432/ibvap" className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health?.components?.map(comp => (
                <div key={comp.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full',
                      comp.status === 'healthy' ? 'bg-green-500' :
                      comp.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">{comp.message}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-1 text-xs font-medium rounded',
                    comp.status === 'healthy' ? 'bg-green-900/30 text-green-400' :
                    comp.status === 'degraded' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  )}>
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}