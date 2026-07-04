import { create } from 'zustand';
import type {
  BatteryStateSnapshot,
  PerformanceStateSnapshot,
  PhonePowerStateSnapshot,
  LiveActivitySnapshot,
  ControlCenterConfigSnapshot,
  LockScreenConfigSnapshot,
  StatusBarConfigSnapshot,
} from '@/types';

interface PhoneOsState {
  initialized: boolean;
  power: PhonePowerStateSnapshot | null;
  battery: BatteryStateSnapshot | null;
  performance: PerformanceStateSnapshot | null;
  liveActivities: LiveActivitySnapshot[];
  controlCenter: ControlCenterConfigSnapshot | null;
  lockScreen: LockScreenConfigSnapshot | null;
  statusBar: StatusBarConfigSnapshot | null;
  isMultitaskingOpen: boolean;
  setInitialized: (v: boolean) => void;
  setPower: (power: PhonePowerStateSnapshot) => void;
  setBattery: (battery: BatteryStateSnapshot) => void;
  setPerformance: (performance: PerformanceStateSnapshot) => void;
  setLiveActivities: (activities: LiveActivitySnapshot[]) => void;
  upsertLiveActivity: (activity: LiveActivitySnapshot) => void;
  removeLiveActivity: (id: string) => void;
  setControlCenter: (config: ControlCenterConfigSnapshot) => void;
  setLockScreen: (config: LockScreenConfigSnapshot) => void;
  setStatusBar: (config: StatusBarConfigSnapshot) => void;
  setMultitaskingOpen: (open: boolean) => void;
  hydrate: (data: {
    power?: PhonePowerStateSnapshot;
    battery?: BatteryStateSnapshot;
    performance?: PerformanceStateSnapshot;
    configs?: {
      controlCenter?: ControlCenterConfigSnapshot;
      lockScreen?: LockScreenConfigSnapshot;
      statusBar?: StatusBarConfigSnapshot;
    };
  }) => void;
}

export const usePhoneOsStore = create<PhoneOsState>((set) => ({
  initialized: false,
  power: null,
  battery: null,
  performance: null,
  liveActivities: [],
  controlCenter: null,
  lockScreen: null,
  statusBar: null,
  isMultitaskingOpen: false,

  setInitialized: (initialized) => set({ initialized }),
  setPower: (power) => set({ power }),
  setBattery: (battery) => set({ battery }),
  setPerformance: (performance) => set({ performance }),
  setLiveActivities: (liveActivities) => set({ liveActivities }),
  upsertLiveActivity: (activity) =>
    set((s) => {
      const filtered = s.liveActivities.filter((a) => a.id !== activity.id);
      if (activity.state === 'ended' || activity.state === 'dismissed') {
        return { liveActivities: filtered };
      }
      return { liveActivities: [activity, ...filtered] };
    }),
  removeLiveActivity: (id) =>
    set((s) => ({ liveActivities: s.liveActivities.filter((a) => a.id !== id) })),
  setControlCenter: (controlCenter) => set({ controlCenter }),
  setLockScreen: (lockScreen) => set({ lockScreen }),
  setStatusBar: (statusBar) => set({ statusBar }),
  setMultitaskingOpen: (isMultitaskingOpen) => set({ isMultitaskingOpen }),

  hydrate: (data) =>
    set((s) => ({
      power: data.power ?? s.power,
      battery: data.battery ?? s.battery,
      performance: data.performance ?? s.performance,
      controlCenter: data.configs?.controlCenter ?? s.controlCenter,
      lockScreen: data.configs?.lockScreen ?? s.lockScreen,
      statusBar: data.configs?.statusBar ?? s.statusBar,
      initialized: true,
    })),
}));
