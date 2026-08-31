import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCameras, useAlerts, useHealth, useStorage } from '@/hooks/useData'
import {
  Video,
  AlertTriangle,
  HardDrive,
  Server,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const severityColors = {
  critical: 'alert-critical',
  warning: 'alert-warning',
  info: 'alert-info',
}

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: CheckCircle,
}

export function Dashboard() {
  const { cameras, loading: camerasLoading } = useCameras()
  const { alerts, loading: alertsLoading } = useAlerts()
  const { health } = useHealth()
  const { storage } = useStorage()
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)

  const onlineCameras = cameras.filter(c => c.status === 'online').length
  const totalCameras = cameras.length
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  if (camerasLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Hero - SIH + Forces */}
      <div className="rounded-xl overflow-hidden border border-border glass-card">
        <div className="tricolor-bar" />
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2">IBVAP — Intelligent Border Video Analytics Platform</h1>
            <p className="text-sm text-muted-foreground mt-1">Transforming existing CCTV at BOPs into an AI surveillance network • <span className="text-primary font-medium">सीमा सुरक्षा — देश सुरक्षा</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border', health?.status === 'healthy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-amber-950/60 text-amber-300 border-amber-800')}>
              ● {health?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            <span className="hidden md:inline text-xs px-2.5 py-1 rounded-full bg-white/5 border border-border text-muted-foreground">Ministry of Home Affairs • BSF</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Cameras</CardTitle>
            <Video className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCameras}</div>
            <p className="text-xs text-muted-foreground">{onlineCameras} online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Active Alerts</CardTitle>
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{unacknowledgedAlerts}</div>
            <p className="text-xs text-muted-foreground">{criticalAlerts} critical</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Storage Used</CardTitle>
            <HardDrive className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{storage?.total_size_mb || 0} MB</div>
            <p className="text-xs text-muted-foreground">{storage?.clip_count || 0} clips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">System Health</CardTitle>
            <Server className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {health?.components?.filter(c => c.status === 'healthy').length || 0} / {health?.components?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Services healthy</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Cameras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cameras.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cameras configured</p>
                <a href="/cameras" className="text-primary hover:underline mt-2 inline-block">Add Camera</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cameras.map((camera) => (
                  <div
                    key={camera.id}
                    className={cn(
                      'relative aspect-video rounded-lg bg-gray-900 border border-border overflow-hidden cursor-pointer transition-all',
                      selectedCamera === camera.id ? 'ring-2 ring-primary' : 'hover:ring-2 ring-primary/50'
                    )}
                    onClick={() => setSelectedCamera(selectedCamera === camera.id ? null : camera.id)}
                  >
                    <div className="absolute top-2 left-2 z-10 flex gap-1">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        camera.status === 'online' ? 'bg-green-900/80 text-green-300' : 'bg-red-900/80 text-red-300'
                      )}>
                        {camera.status}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 z-10 bg-black/60 px-2 py-1 rounded">
                      <p className="text-sm font-medium truncate">{camera.name}</p>
                      <p className="text-xs text-muted-foreground">{camera.location || 'Unknown location'}</p>
                    </div>
                    {selectedCamera === camera.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No recent alerts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.slice(0, 10).map((alert) => {
                  const Icon = severityIcons[alert.severity] || AlertTriangle
                  return (
                    <div key={alert.id} className={cn('p-3 rounded-lg border-l-4', severityColors[alert.severity])}>
                      <div className="flex items-start gap-2">
                        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.camera_id} • {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </p>
                          {alert.class_name && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                              {alert.class_name} {alert.confidence ? `(${Math.round(alert.confidence * 100)}%)` : ''}
                            </span>
                          )}
                        </div>
                        {!alert.acknowledged && (
                          <span className="text-xs text-yellow-400">Unack</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}