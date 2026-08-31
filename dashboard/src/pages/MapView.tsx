import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCameras } from '@/hooks/useData'
import { MapPin, Video, Wifi, WifiOff, Eye, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    L: any
  }
}

export function MapView() {
  const { cameras, loading } = useCameras()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstance.current) return

      try {
        const L = await import('leaflet')
        window.L = L.default

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const map = L.default.map(mapRef.current!, {
          center: [23.5, 80.5],
          zoom: 5,
          zoomControl: true,
          minZoom: 4,
          maxZoom: 18,
        })

        // Satellite + street layers
        const osm = L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map)

        const satellite = L.default.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Esri World Imagery',
          maxZoom: 18,
        })

        L.default.control.layers({ "Street": osm, "Satellite": satellite }).addTo(map)

        // Indian Border highlight - IB (Pakistan) and LAC (China) approximate
        const ibPakistan: [number, number][] = [
          [32.5, 74.5], [31.8, 74.8], [30.9, 74.6], [29.5, 73.8], [28.2, 72.5], [27.0, 71.2],
          [26.2, 70.5], [25.3, 69.8], [24.5, 68.9], [23.8, 68.5]
        ]
        const lacChina: [number, number][] = [
          [34.5, 76.5], [33.8, 78.2], [32.9, 79.5], [31.5, 80.8], [30.2, 82.5], [28.8, 85.5], [27.5, 88.5]
        ]
        L.default.polyline(ibPakistan, { color: '#ff6b1a', weight: 3, opacity: 0.9, dashArray: '8,6' }).addTo(map).bindPopup("International Border (Pakistan) — BSF BOPs")
        L.default.polyline(lacChina, { color: '#ef4444', weight: 3, opacity: 0.9, dashArray: '10,6' }).addTo(map).bindPopup("Line of Actual Control (China) — ITBP")

        // Border zones highlight
        L.default.rectangle([[32.8, 74.2], [24.0, 68.2]], { color: "#ff6b1a", weight: 1, fillColor: "#ff6b1a", fillOpacity: 0.06 }).addTo(map)
        L.default.rectangle([[35.0, 76.0], [27.0, 89.0]], { color: "#ef4444", weight: 1, fillColor: "#ef4444", fillOpacity: 0.05 }).addTo(map)

        mapInstance.current = map
        setMapLoaded(true)

        // Add markers for cameras with coordinates (if none, add demo BOPs)
        const camsToShow = cameras.filter(c => c.latitude && c.longitude).length > 0 ? cameras : [
          { id: "demo1", name: "BOP Jaisalmer (RJ)", location: "Thar Desert - IB", latitude: 26.9, longitude: 70.9, status: "online", fps: 24.5 } as any,
          { id: "demo2", name: "BOP Wagah (PB)", location: "Punjab - IB", latitude: 31.6, longitude: 74.57, status: "online", fps: 22.1 } as any,
          { id: "demo3", name: "BOP Leh (Ladakh)", location: "Ladakh - LAC", latitude: 34.15, longitude: 77.57, status: "online", fps: 25.0 } as any,
          { id: "demo4", name: "BOP Tawang (AR)", location: "Arunachal - LAC", latitude: 27.58, longitude: 91.85, status: "online", fps: 23.3 } as any,
        ]
        camsToShow.forEach(cam => { if (cam.latitude && cam.longitude) addMarker(cam) })
      } catch (error) {
        console.error('Failed to load map:', error)
      }
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Update markers when cameras change
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return

    cameras.forEach(cam => {
      if (cam.latitude && cam.longitude) {
        if (!markersRef.current.has(cam.id)) {
          addMarker(cam)
        } else {
          updateMarker(cam)
        }
      }
    })

    // Remove markers for cameras that no longer have coordinates
    markersRef.current.forEach((marker, id) => {
      const cam = cameras.find(c => c.id === id)
      if (!cam || !cam.latitude || !cam.longitude) {
        mapInstance.current?.removeLayer(marker)
        markersRef.current.delete(id)
      }
    })
  }, [cameras, mapLoaded])

  const addMarker = (cam: any) => {
    if (!mapInstance.current) return

    const L = window.L
    const statusColor = cam.status === 'online' ? '#22c55e' : '#ef4444'

    const icon = L.default.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px; height: 24px;
          border-radius: 50%;
          background: ${statusColor};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = L.default.marker([cam.latitude, cam.longitude], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px; color: #111;">${cam.name}</h4>
          <p style="margin: 4px 0; color: #666;"><strong>Status:</strong> <span style="color: ${statusColor}">${cam.status}</span></p>
          <p style="margin: 4px 0; color: #666;"><strong>Location:</strong> ${cam.location || 'Unknown'}</p>
          <p style="margin: 4px 0; color: #666;"><strong>FPS:</strong> ${cam.fps.toFixed(1)}</p>
        </div>
      `)

    marker.on('click', () => {
      setSelectedCamera(cam.id)
      mapInstance.current?.setView([cam.latitude, cam.longitude], 15)
    })

    markersRef.current.set(cam.id, marker)
  }

  const updateMarker = (cam: any) => {
    const marker = markersRef.current.get(cam.id)
    if (marker) {
      const statusColor = cam.status === 'online' ? '#22c55e' : '#ef4444'
      const iconEl = marker.getElement()
      if (iconEl) {
        const circle = iconEl.querySelector('div')
        if (circle) {
          circle.style.background = statusColor
        }
      }
      marker.setPopupContent(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px; color: #111;">${cam.name}</h4>
          <p style="margin: 4px 0; color: #666;"><strong>Status:</strong> <span style="color: ${statusColor}">${cam.status}</span></p>
          <p style="margin: 4px 0; color: #666;"><strong>Location:</strong> ${cam.location || 'Unknown'}</p>
          <p style="margin: 4px 0; color: #666;"><strong>FPS:</strong> ${cam.fps.toFixed(1)}</p>
        </div>
      `)
    }
  }

  const camerasWithCoords = cameras.filter(c => c.latitude && c.longitude)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🇮🇳 Indian Border Map <span className="text-xs px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30">BOP Surveillance</span></h1>
          <p className="text-sm text-muted-foreground">International Border (Saffron dashed) & LAC (Red dashed) • BSF / ITBP BOPs • Street / Satellite toggle top-right</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ff6b1a] inline-block" style={{borderTop:"2px dashed #ff6b1a"}}/> IB (Pakistan)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block" style={{borderTop:"2px dashed #ef4444"}}/> LAC (China)</span>
          <span className="hidden md:inline text-muted-foreground">{camerasWithCoords.length} / {cameras.length} with GPS</span>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          <div
            ref={mapRef}
            className="w-full h-full rounded-lg border border-border overflow-hidden"
          />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/90 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Camera List Panel */}
        <div className="w-80 bg-card border-l border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Cameras</h3>
            <p className="text-xs text-muted-foreground">{camerasWithCoords.length} with coordinates</p>
          </div>
          <div className="p-4 space-y-2 max-h-[calc(100%-100px)] overflow-y-auto">
            {camerasWithCoords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cameras with GPS coordinates</p>
                <p className="text-xs">Add latitude/longitude in camera settings</p>
              </div>
            ) : (
              camerasWithCoords.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => {
                    setSelectedCamera(cam.id)
                    mapInstance.current?.setView([cam.latitude, cam.longitude], 15)
                    const marker = markersRef.current.get(cam.id)
                    marker?.openPopup()
                  }}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors border',
                    selectedCamera === cam.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent border-border'
                  )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{cam.name}</span>
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{cam.location}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Video className="w-3 h-3" />
                      <span>{cam.fps.toFixed(1)} FPS</span>
                    </div>
                  </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}