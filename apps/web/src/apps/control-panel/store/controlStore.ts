import { create } from 'zustand';
import type { ControlTab, RecordedEvent } from '../types';

interface ControlState {
  activeTab: ControlTab;
  liveEvents: RecordedEvent[];
  setTab: (tab: ControlTab) => void;
  pushEvent: (event: RecordedEvent) => void;
  setLiveEvents: (events: RecordedEvent[]) => void;
}

export const useControlStore = create<ControlState>((set) => ({
  activeTab: 'dashboard',
  liveEvents: [],
  setTab: (activeTab) => set({ activeTab }),
  pushEvent: (event) => set((s) => ({ liveEvents: [event, ...s.liveEvents].slice(0, 200) })),
  setLiveEvents: (liveEvents) => set({ liveEvents }),
}));
