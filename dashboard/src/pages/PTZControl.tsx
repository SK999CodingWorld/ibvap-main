import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCameras } from '@/hooks/useData'
import { api } from '@/api/client'
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ZoomIn, ZoomOut, StopCircle, Home, Save, Loader2,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight,
  Plus, Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function PTZControl() {
  const { cameraId } = useParams<{ cameraId: string }>()
  const { cameras } = useCameras()
  const camera = cameras.find(c => c.id === cameraId)

  const [status, setStatus] = useState<any>(null)
  const [presets, setPresets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [moving, setMoving] = useState<string | null>(null)

  useEffect(() => {
    if (cameraId) {
      fetchStatus()
      fetchPresets()
      const interval = setInterval(fetchStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [cameraId])

  const fetchStatus = async () => {
    try {
      const data = await api.getPTZStatus(cameraId!)
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch PTZ status:', error)
    }
  }

  const fetchPresets = async () => {
    try {
      const data = await api.getPresets(cameraId!)
      setPresets(data.presets)
    } catch (error) {
      console.error('Failed to fetch presets:', error)
    }
  }

  const move = async (direction: 'pan' | 'tilt' | 'zoom', value: number) => {
    if (!cameraId) return
    setMoving(direction)
    try {
      await api.moveRelative(cameraId, 
        direction === 'pan' ? value : 0,
        direction === 'tilt' ? value : 0,
        direction === 'zoom' ? value : 0,
        0.5
      )
      await fetchStatus()
    } catch (error) {
      console.error('PTZ move failed:', error)
    } finally {
      setMoving(null)
    }
  }

  const moveContinuous = async (direction: 'pan' | 'tilt' | 'zoom', value: number) => {
    if (!cameraId) return
    setMoving(direction)
    try {
      await api.moveContinuous(cameraId,
        direction === 'pan' ? value : 0,
        direction === 'tilt' ? value : 0,
        direction === 'zoom' ? value : 0,
        0.5
      )
    } catch (error) {
      console.error('PTZ continuous move failed:', error)
    }
  }

  const stopMove = async () => {
    if (!cameraId) return
    try {
      await api.stopPTZ(cameraId)
      await fetchStatus()
    } catch (error) {
      console.error('PTZ stop failed:', error)
    } finally {
      setMoving(null)
    }
  }

  const gotoPreset = async (name: string) => {
    if (!cameraId) return
    setLoading(true)
    try {
      await api.gotoPreset(cameraId, name)
      await fetchStatus()
    } catch (error) {
      console.error('Goto preset failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreset = async () => {
    if (!cameraId || !presetName || !status) return
    setLoading(true)
    try {
      await api.setPreset(cameraId, {
        name: presetName,
        pan: status.pan,
        tilt: status.tilt,
        zoom: status.zoom,
      })
      setPresetName('')
      await fetchPresets()
    } catch (error) {
      console.error('Save preset failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializePTZ = async () => {
    if (!cameraId) return
    setLoading(true)
    try {
      await api.initializePTZ(cameraId)
      await fetchStatus()
      await fetchPresets()
    } catch (error) {
      console.error('Initialize PTZ failed:', error)
      alert('Failed to initialize PTZ. Check ONVIF credentials.')
    } finally {
      setLoading(false)
    }
  }

  if (!camera) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Camera not found</h1>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PTZ Control - {camera.name}</h1>
          <p className="text-muted-foreground">Pan-Tilt-Zoom camera control</p>
        </div>
        <button
          onClick={initializePTZ}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Loader2 className={cn('w-4 h-4 inline mr-1', loading ? 'animate-spin' : '')} />
          Initialize PTZ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed + Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live View</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  status?.moving ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'
                )}>
                  {status?.moving ? 'MOVING' : 'IDLE'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {/* PTZ Directional Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="grid grid-cols-3 gap-1 p-4 pointer-events-auto">
                  {/* Top Row */}
                  <button
                    onMouseDown={() => moveContinuous('tilt', -0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'tilt'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'tilt' && 'bg-primary/50')}
                    title="Tilt Up"
                  >
                    <ChevronsUp className="w-6 h-6" />
                  </button>
                  <div></div>
                  <button
                    onMouseDown={() => moveContinuous('zoom', 0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'zoom'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'zoom' && 'bg-primary/50')}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-6 h-6" />
                  </button>

                  {/* Middle Row */}
                  <button
                    onMouseDown={() => moveContinuous('pan', -0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'pan'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'pan' && 'bg-primary/50')}
                    title="Pan Left"
                  >
                    <ChevronsLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={stopMove}
                    className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    title="Stop"
                  >
                    <StopCircle className="w-8 h-8" />
                  </button>
                  <button
                    onMouseDown={() => moveContinuous('pan', 0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'pan'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'pan' && 'bg-primary/50')}
                    title="Pan Right"
                  >
                    <ChevronsRight className="w-6 h-6" />
                  </button>

                  {/* Bottom Row */}
                  <button
                    onMouseDown={() => moveContinuous('tilt', 0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'tilt'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'tilt' && 'bg-primary/50')}
                    title="Tilt Down"
                  >
                    <ChevronsDown className="w-6 h-6" />
                  </button>
                  <div></div>
                  <button
                    onMouseDown={() => moveContinuous('zoom', -0.5)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    disabled={moving !== null && moving !== 'zoom'}
                    className={cn('p-2 rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50', moving === 'zoom' && 'bg-primary/50')}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Preset Buttons Overlay */}
              {presets.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 pointer-events-auto z-10">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {presets.slice(0, 6).map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => gotoPreset(preset.name)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded border border-white/20 disabled:opacity-50"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Display */}
              <div className="absolute top-4 left-4 right-4 pointer-events-none z-10">
                <div className="flex justify-center gap-4">
                  <div className="bg-black/60 px-3 py-1 rounded text-xs text-white">
                    Pan: {status?.pan?.toFixed(2) || '0.00'}
                  </div>
                  <div className="bg-black/60 px-3 py-1 rounded text-xs text-white">
                    Tilt: {status?.tilt?.toFixed(2) || '0.00'}
                  </div>
                  <div className="bg-black/60 px-3 py-1 rounded text-xs text-white">
                    Zoom: {status?.zoom?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Presets</CardTitle>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary w-40"
                />
                <button
                  onClick={savePreset}
                  disabled={loading || !presetName || !status}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {presets.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No presets saved</p>
              ) : (
                <div className="space-y-2">
                  {presets.map(preset => (
                    <div key={preset.name} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Pan: {preset.pan?.toFixed(2)} | Tilt: {preset.tilt?.toFixed(2)} | Zoom: {preset.zoom?.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => gotoPreset(preset.name)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Absolute Position */}
          <Card>
            <CardHeader>
              <CardTitle>Absolute Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pan (-1 to 1)</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={status?.pan || 0}
                  onChange={(e) => move('pan', parseFloat(e.target.value) - (status?.pan || 0))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Current: {status?.pan?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tilt (-1 to 1)</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={status?.tilt || 0}
                  onChange={(e) => move('tilt', parseFloat(e.target.value) - (status?.tilt || 0))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Current: {status?.tilt?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zoom (0 to 1)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={status?.zoom || 0}
                  onChange={(e) => move('zoom', parseFloat(e.target.value) - (status?.zoom || 0))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Current: {status?.zoom?.toFixed(2) || '0.00'}</p>
              </div>
              <button
                onClick={stopMove}
                className="w-full px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30"
              >
                <StopCircle className="w-4 h-4 inline mr-1" />
                Stop Movement
              </button>
            </CardContent>
          </Card>

          {/* Camera Info */}
          <Card>
            <CardHeader>
              <CardTitle>Camera Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn('font-medium', camera?.status === 'online' ? 'text-green-400' : 'text-red-400')}>
                  {camera?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PTZ Enabled</span>
                <span className="font-medium">{camera?.ptz_enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FPS</span>
                <span className="font-medium">{camera?.fps?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution</span>
                <span className="font-medium">{camera?.resolution || 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}