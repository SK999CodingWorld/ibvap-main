import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Video,
  Bell,
  HardDrive,
  MapPin,
  Settings,
  Shield,
  Server,
  AlertTriangle,
  CheckCircle,
  Award,
  Flag,
} from 'lucide-react'
import { useHealth } from '@/hooks/useData'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cameras', href: '/cameras', icon: Video },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Recordings', href: '/recordings', icon: HardDrive },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const { health } = useHealth()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400'
      case 'degraded': return 'text-amber-400'
      case 'unhealthy': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case 'unhealthy': return <Server className="w-4 h-4 text-red-400" />
      default: return <Shield className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Tricolor top bar */}
      <div className="tricolor-bar" />
      
      {/* Top header - SIH + Forces branding */}
      <header className="h-14 bg-card/80 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow">
              <Shield className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-[11px] font-bold tracking-[0.18em] text-primary leading-none">BHARAT RAKSHAK</h1>
              <p className="text-[10px] tracking-widest text-muted-foreground leading-none mt-0.5">IBVAP • Border Intelligence</p>
            </div>
          </div>
          
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
            <Flag className="w-3.5 h-3.5 text-primary" />
            <span className="tracking-wide">सीमा सुरक्षा — देश सुरक्षा</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </div>
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-border">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">JAI HIND</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card/60 backdrop-blur border-r border-border flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center saffron-glow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide leading-none">IBVAP</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-1">v1.0</p>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-orange-500/10 via-white/5 to-green-600/10 border border-border/50">
            <p className="text-[11px] font-semibold text-primary">Ministry of Home Affairs</p>
            <p className="text-[11px] text-muted-foreground">Border Security Forces • BOP Surveillance</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white shadow saffron-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] border border-transparent hover:border-border/50'
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-3">
          <div className="rounded-lg bg-slate-900/60 border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wide">SYSTEM HEALTH</span>
              {health && getStatusIcon(health.status)}
            </div>
            <div className="space-y-1.5 text-xs">
              {health?.components.slice(0,5).map((comp) => (
                <div key={comp.name} className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate mr-2">{comp.name}</span>
                  <span className={cn('font-medium text-[11px] px-1.5 py-0.5 rounded', comp.status==='healthy'?'bg-emerald-950/50 text-emerald-400': comp.status==='degraded'?'bg-amber-950/50 text-amber-300':'bg-red-950/50 text-red-400')}>
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">🇮🇳 MADE FOR BHARAT 🇮🇳</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Smart India Hackathon 2025</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-1 z-20">
        {navigation.slice(0,5).map(i=>(
          <NavLink key={i.name} to={i.href} className={({isActive})=>cn("flex flex-col items-center p-2 text-[11px]", isActive?"text-primary":"text-muted-foreground")}>
            <i.icon className="w-5 h-5" /><span>{i.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      </div>
      <div className="tricolor-bar" />
    </div>
  )
}
