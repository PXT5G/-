import { create } from 'zustand';
import type { BankTab, Dashboard } from '../types';

interface BankState {
  activeTab: BankTab;
  dashboard: Dashboard | null;
  selectedAccountId: string | null;
  cardFlipped: boolean;
  loading: boolean;
  setTab: (tab: BankTab) => void;
  setDashboard: (dashboard: Dashboard | null) => void;
  setSelectedAccountId: (id: string | null) => void;
  setCardFlipped: (flipped: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useBankStore = create<BankState>((set) => ({
  activeTab: 'home',
  dashboard: null,
  selectedAccountId: null,
  cardFlipped: false,
  loading: true,
  setTab: (activeTab) => set({ activeTab }),
  setDashboard: (dashboard) => set({ dashboard }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setCardFlipped: (cardFlipped) => set({ cardFlipped }),
  setLoading: (loading) => set({ loading }),
}));
