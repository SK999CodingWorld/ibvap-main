import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { SimulationBanner } from '@/components/ui/SimulationBanner';
import { 
  LayoutDashboard, Monitor, Camera, Bell, AlertTriangle, 
  Footprints, CarFront, Fence, Map, Archive, HeartPulse, 
  BarChart3, Activity, Shield, FileText, Users, Settings, Play,
  Cpu, Video, Flame, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/command-center', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/surveillance', icon: Monitor, label: 'Live Surveillance' },
  { path: '/cameras', icon: Camera, label: 'Cameras' },
  { path: '/tracking', icon: Footprints, label: 'Objects & Tracking' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { path: '/anpr', icon: CarFront, label: 'ANPR' },
  { path: '/virtual-fences', icon: Fence, label: 'Virtual Fences' },
  { path: '/map', icon: Map, label: 'Map Intelligence' },
  { path: '/evidence', icon: Archive, label: 'Evidence Vault' },
  { path: '/video-analyzer', icon: Video, label: 'Video Analyzer', badge: 'NEW' },
  { path: '/heatmap', icon: Flame, label: 'Surveillance Heatmap', badge: 'NEW' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ai-models', icon: Cpu, label: 'AI Model Center', badge: 'NEW' },
  { path: '/camera-health', icon: HeartPulse, label: 'Camera Health' },
  { path: '/system-health', icon: Activity, label: 'System Health' },
  { path: '/security', icon: Shield, label: 'Security Center' },
  { path: '/users', icon: Users, label: 'Users & Roles' },
  { path: '/demo', icon: Play, label: 'Demo Center' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">IB</div>
          <div>
            <h1 className="font-bold tracking-wider text-white">IBVAP</h1>
            <p className="text-[10px] text-slate-400 font-mono">Border Video Intelligence</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/command-center' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center font-bold text-cyan-400 text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || user?.username || 'Officer'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-mono">{user?.role || 'OPERATOR'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-left text-xs text-slate-400 hover:text-red-400 font-mono transition-colors">
            ← Sign Out Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SimulationBanner />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
