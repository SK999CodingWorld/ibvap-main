import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCameras } from '@/hooks/useData'
import { api } from '@/api/client'
import { Video, Plus, Edit, Trash2, Wifi, WifiOff, Eye, Settings, MapPin, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Camera } from '@/api/types'
type CameraCreate = Omit<Camera, 'id' | 'status' | 'created_at' | 'updated_at' | 'fps' | 'bitrate' | 'resolution' | 'last_seen' | 'error_message'>

export function Cameras() {
  const { cameras, loading, refetch } = useCameras()
  const [showForm, setShowForm] = useState(false)
  const [editingCamera, setEditingCamera] = useState<any>(null)
  const [formData, setFormData] = useState<CameraCreate>({
    name: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    protocol: 'rtsp',
    stream_url: '',
    username: '',
    password: '',
    rtsp_transport: 'tcp',
    enabled: true,
    zones: [],
    ptz_enabled: false,
    ptz_presets: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCamera) {
        await api.updateCamera(editingCamera.id, formData)
      } else {
        await api.createCamera(formData)
      }
      setShowForm(false)
      setEditingCamera(null)
      resetForm()
      refetch()
    } catch (error) {
      console.error('Failed to save camera:', error)
      alert('Failed to save camera')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this camera?')) {
      try {
        await api.deleteCamera(id)
        refetch()
      } catch (error) {
        console.error('Failed to delete camera:', error)
        alert('Failed to delete camera')
      }
    }
  }

  const handleEdit = (camera: any) => {
    setEditingCamera(camera)
    setFormData({
      name: camera.name,
      location: camera.location || '',
      latitude: camera.latitude,
      longitude: camera.longitude,
      protocol: camera.protocol,
      stream_url: camera.stream_url,
      username: camera.username || '',
      password: '',
      rtsp_transport: camera.rtsp_transport,
      enabled: camera.enabled,
      zones: camera.zones,
      ptz_enabled: camera.ptz_enabled,
      ptz_presets: camera.ptz_presets,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      latitude: undefined,
      longitude: undefined,
      protocol: 'rtsp',
      stream_url: '',
      username: '',
      password: '',
      rtsp_transport: 'tcp',
      enabled: true,
      zones: [],
      ptz_enabled: false,
      ptz_presets: [],
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Zap className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cameras</h1>
          <p className="text-muted-foreground">Manage video sources and PTZ controls</p>
        </div>
        <button
          onClick={() => { setEditingCamera(null); resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Camera
        </button>
      </div>

      {showForm && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border p-6">
            <CardHeader>
              <CardTitle>{editingCamera ? 'Edit Camera' : 'Add Camera'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Protocol</label>
                  <select
                    value={formData.protocol}
                    onChange={(e) => setFormData({...formData, protocol: e.target.value as any})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="rtsp">RTSP</option>
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="rtmp">RTMP</option>
                    <option value="hls">HLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stream URL *</label>
                <input
                  type="text"
                  value={formData.stream_url}
                  onChange={(e) => setFormData({...formData, stream_url: e.target.value})}
                  placeholder="rtsp://user:pass@192.168.1.100:554/stream1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || undefined})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || undefined})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ptz_enabled}
                    onChange={(e) => setFormData({...formData, ptz_enabled: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">PTZ Enabled</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCamera(null); resetForm(); }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {editingCamera ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="flex flex-col">
            <div className="aspect-video bg-gray-900 relative overflow-hidden rounded-t-lg">
              <div className="absolute top-2 left-2 right-2 flex justify-between">
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  camera.status === 'online' ? 'bg-green-900/80 text-green-300' : 'bg-red-900/80 text-red-300'
                )}>
                  {camera.status}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                  {camera.protocol.toUpperCase()}
                </span>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-sm font-medium text-white bg-black/60 px-2 py-1 rounded inline-block">{camera.name}</p>
              </div>
            </div>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {camera.location || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  {camera.ptz_enabled ? <Zap className="w-3 h-3 text-yellow-400" /> : <Video className="w-3 h-3" />}
                  {camera.ptz_enabled ? 'PTZ' : 'Fixed'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">{camera.stream_url}</p>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                <span className={cn('flex-1 px-2 py-1 text-xs rounded text-center', camera.enabled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')}>
                  {camera.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => handleEdit(camera)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(camera.id)}
                  className="p-1 hover:bg-accent rounded transition-colors text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {cameras.length === 0 && (
          <Card className="col-span-full text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No cameras configured</h3>
            <p className="text-muted-foreground mb-4">Add your first camera to start monitoring</p>
            <button
              onClick={() => { setEditingCamera(null); resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Add Camera
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}