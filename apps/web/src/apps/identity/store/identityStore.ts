import { create } from 'zustand';
import type { IdentityData, IdentityTab, IdentitySettings } from '../types';

interface IdentityState {
  identity: IdentityData | null;
  settings: IdentitySettings | null;
  activeTab: IdentityTab;
  cardFlipped: boolean;
  loading: boolean;
  setIdentity: (identity: IdentityData | null) => void;
  setSettings: (settings: IdentitySettings | null) => void;
  setTab: (tab: IdentityTab) => void;
  setCardFlipped: (flipped: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: null,
  settings: null,
  activeTab: 'home',
  cardFlipped: false,
  loading: true,
  setIdentity: (identity) => set({ identity }),
  setSettings: (settings) => set({ settings }),
  setTab: (activeTab) => set({ activeTab, cardFlipped: false }),
  setCardFlipped: (cardFlipped) => set({ cardFlipped }),
  setLoading: (loading) => set({ loading }),
}));
