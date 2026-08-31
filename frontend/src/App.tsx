import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { CommandCenter } from './pages/CommandCenter';
import { LiveSurveillance } from './pages/LiveSurveillance';
import { CameraManagement } from './pages/CameraManagement';
import { CameraHealth } from './pages/CameraHealth';
import { DemoCenter } from './pages/DemoCenter';
import { NotFoundPage } from './pages/NotFoundPage';
import { AlertsPage } from './pages/AlertsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { PeopleObjects } from './pages/PeopleObjects';
import { MultiCameraTracking } from './pages/MultiCameraTracking';
import { ANPRPage } from './pages/ANPRPage';
import { VirtualFences } from './pages/VirtualFences';
import { MapIntelligence } from './pages/MapIntelligence';
import { EvidenceVault } from './pages/EvidenceVault';
import { AuditLog } from './pages/AuditLog';
import { SecurityCenter } from './pages/SecurityCenter';
import { UsersRoles } from './pages/UsersRoles';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemHealth } from './pages/SystemHealth';
import { SettingsPage } from './pages/SettingsPage';
import { AIModelCenter } from './pages/AIModelCenter';
import { VideoAnalyzer } from './pages/VideoAnalyzer';
import { SurveillanceHeatmap } from './pages/SurveillanceHeatmap';
import { PresentationMode } from './components/presentation/PresentationMode';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/command-center" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/surveillance" element={<LiveSurveillance />} />
          <Route path="/cameras" element={<CameraManagement />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/tracking" element={<PeopleObjects />} />
          <Route path="/tracking/cross-camera" element={<MultiCameraTracking />} />
          <Route path="/anpr" element={<ANPRPage />} />
          <Route path="/virtual-fences" element={<VirtualFences />} />
          <Route path="/map" element={<MapIntelligence />} />
          <Route path="/evidence" element={<EvidenceVault />} />
          <Route path="/video-analyzer" element={<VideoAnalyzer />} />
          <Route path="/heatmap" element={<SurveillanceHeatmap />} />
          <Route path="/ai-models" element={<AIModelCenter />} />
          <Route path="/camera-health" element={<CameraHealth />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/security" element={<SecurityCenter />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/users" element={<UsersRoles />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/demo" element={<DemoCenter />} />
          <Route path="/presentation" element={<PresentationMode />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
