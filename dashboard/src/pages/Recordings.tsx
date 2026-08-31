import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCameras, useStorage } from '@/hooks/useData'
import { api } from '@/api/client'
import { HardDrive, Video, Download, Trash2, Calendar, Clock, Loader2, FileVideo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Clip {
  name: string
  path: string
  event_type?: string
  size_mb: number
  created: string
  modified: string
}

export function Recordings() {
  const { cameras } = useCameras()
  const { storage, refetch } = useStorage()
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loadingClips, setLoadingClips] = useState(false)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [exportModal, setExportModal] = useState<{open: boolean, cameraId: string} | null>(null)
  const [exportRange, setExportRange] = useState({ start: '', end: '' })

  useEffect(() => {
    if (selectedCamera) {
      loadClips()
    }
  }, [selectedCamera, eventTypeFilter])

  const loadClips = async () => {
    if (!selectedCamera) return
    setLoadingClips(true)
    try {
      const data = await api.getEventClips(selectedCamera, eventTypeFilter !== 'all' ? eventTypeFilter : undefined)
      setClips(data.clips)
    } catch (error) {
      console.error('Failed to load clips:', error)
    } finally {
      setLoadingClips(false)
    }
  }

  const handleExport = async () => {
    if (!exportModal || !exportRange.start || !exportRange.end) return
    try {
      const result = await api.exportEvidence(exportModal.cameraId, exportRange.start, exportRange.end)
      alert(`Evidence exported to: ${result.path}`)
      setExportModal(null)
    } catch (error) {
      console.error('Failed to export evidence:', error)
      alert('Failed to export evidence')
    }
  }

  const handleDeleteClip = async (clipPath: string) => {
    // Note: This would need a DELETE endpoint on the backend
    console.log('Delete clip:', clipPath)
  }

  if (!cameras.length) {
    return (
      <div className="p-6 text-center">
        <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">No cameras configured</h3>
        <p className="text-muted-foreground">Add cameras to start recording events</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recordings</h1>
          <p className="text-muted-foreground">Event clips and evidence management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {storage?.total_size_mb || 0} MB used • {storage?.clip_count || 0} clips
          </div>
        </div>
      </div>

      {/* Camera Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Camera:</span>
            </div>
            <div className="flex gap-2">
              {cameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(selectedCamera === cam.id ? null : cam.id)}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    selectedCamera === cam.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  )}
                >
                  {cam.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCamera && (
        <>
          {/* Clips List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event Clips - {cameras.find(c => c.id === selectedCamera)?.name}</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="px-3 py-1 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Events</option>
                  <option value="zone_entry">Zone Entry</option>
                  <option value="zone_exit">Zone Exit</option>
                  <option value="line_cross">Line Cross</option>
                  <option value="face_matched">Face Matched</option>
                  <option value="plate_matched">Plate Matched</option>
                  <option value="behavior_anomaly">Behavior Anomaly</option>
                  <option value="alert_triggered">Alert Triggered</option>
                </select>
                <button
                  onClick={() => setExportModal({open: true, cameraId: selectedCamera})}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
                >
                  <FileVideo className="w-4 h-4 inline mr-1" />
                  Export Evidence
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingClips ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : clips.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No clips found for this camera</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clips.map(clip => (
                    <div key={clip.path} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileVideo className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{clip.name}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {clip.event_type && (
                              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">
                                {clip.event_type}
                              </span>
                            )}
                            <span>{clip.size_mb} MB</span>
                            <span>{formatDistanceToNow(new Date(clip.created), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-accent rounded" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClip(clip.path)}
                          className="p-1 hover:bg-accent rounded text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Evidence Modal */}
          {exportModal && (
            <Card className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-card w-full max-w-md rounded-lg border border-border p-6">
                <CardHeader>
                  <CardTitle>Export Evidence</CardTitle>
                </CardHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleExport(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      value={exportRange.start}
                      onChange={(e) => setExportRange({...exportRange, start: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      value={exportRange.end}
                      onChange={(e) => setExportRange({...exportRange, end: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setExportModal(null)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex-1"
                    >
                      Export
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}