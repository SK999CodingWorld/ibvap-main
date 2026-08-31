import { create } from 'zustand';
import { DashboardKPIs, Alert, Notification } from '../types';

interface AppState {
  sidebarOpen: boolean;
  simulationMode: boolean;
  simulationSpeed: number;
  networkStatus: 'online' | 'offline';
  dashboardKPIs: DashboardKPIs | null;
  recentAlerts: Alert[];
  recentEvents: any[];
  notifications: Notification[];
  unreadCount: number;
  setSidebarOpen: (open: boolean) => void;
  setSimulationMode: (mode: boolean) => void;
  setDashboardKPIs: (kpis: DashboardKPIs) => void;
  addAlert: (alert: Alert) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  simulationMode: true,
  simulationSpeed: 1,
  networkStatus: 'online',
  dashboardKPIs: null,
  recentAlerts: [],
  recentEvents: [],
  notifications: [],
  unreadCount: 0,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  setDashboardKPIs: (kpis) => set({ dashboardKPIs: kpis }),
  addAlert: (alert) => set((state) => ({ recentAlerts: [alert, ...state.recentAlerts].slice(0, 50) })),
}));
