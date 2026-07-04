import { create } from 'zustand';
import type { SimTab, SimDashboard } from '../types';

interface SimState {
  activeTab: SimTab;
  dashboard: SimDashboard | null;
  activating: boolean;
  loading: boolean;
  setTab: (tab: SimTab) => void;
  setDashboard: (d: SimDashboard | null) => void;
  setActivating: (v: boolean) => void;
  setLoading: (v: boolean) => void;
}

export const useSimStore = create<SimState>((set) => ({
  activeTab: 'home',
  dashboard: null,
  activating: false,
  loading: true,
  setTab: (activeTab) => set({ activeTab }),
  setDashboard: (dashboard) => set({ dashboard }),
  setActivating: (activating) => set({ activating }),
  setLoading: (loading) => set({ loading }),
}));
