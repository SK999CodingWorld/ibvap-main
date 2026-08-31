import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Cameras } from '@/pages/Cameras'
import { Alerts } from '@/pages/Alerts'
import { Recordings } from '@/pages/Recordings'
import { Settings } from '@/pages/Settings'
import { MapView } from '@/pages/MapView'
import { PTZControl } from '@/pages/PTZControl'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cameras" element={<Cameras />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="recordings" element={<Recordings />} />
        <Route path="map" element={<MapView />} />
        <Route path="ptz/:cameraId" element={<PTZControl />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App