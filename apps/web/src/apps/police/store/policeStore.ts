import { create } from 'zustand';
import type { PoliceTab, PoliceDashboard, PoliceAlert } from '../types';

interface PoliceState {
  activeTab: PoliceTab;
  dashboard: PoliceDashboard | null;
  loading: boolean;
  permissions: string[];
  alerts: PoliceAlert[];
  setTab: (tab: PoliceTab) => void;
  setDashboard: (d: PoliceDashboard | null) => void;
  setLoading: (v: boolean) => void;
  setPermissions: (p: string[]) => void;
  pushAlert: (alert: PoliceAlert) => void;
  dismissAlert: (id: string) => void;
}

export const usePoliceStore = create<PoliceState>((set) => ({
  activeTab: 'dashboard',
  dashboard: null,
  loading: true,
  permissions: [],
  alerts: [],
  setTab: (activeTab) => set({ activeTab }),
  setDashboard: (dashboard) => set({ dashboard }),
  setLoading: (loading) => set({ loading }),
  setPermissions: (permissions) => set({ permissions }),
  pushAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 5) })),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
}));
