import { create } from 'zustand';
import type {
  DeviceLocationState,
  NetworkStateSnapshot,
  DeviceStateSnapshot,
  DiagnosticsReport,
} from '@/types';

interface SystemStoreState {
  initialized: boolean;
  location: DeviceLocationState | null;
  network: NetworkStateSnapshot | null;
  deviceState: DeviceStateSnapshot | null;
  diagnostics: DiagnosticsReport | null;
  serviceHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
  setInitialized: (v: boolean) => void;
  setLocation: (v: DeviceLocationState) => void;
  setNetwork: (v: NetworkStateSnapshot) => void;
  setDeviceState: (v: DeviceStateSnapshot) => void;
  setDiagnostics: (v: DiagnosticsReport) => void;
  setServiceHealth: (v: Record<string, 'healthy' | 'degraded' | 'down'>) => void;
}

export const useSystemStore = create<SystemStoreState>((set) => ({
  initialized: false,
  location: null,
  network: null,
  deviceState: null,
  diagnostics: null,
  serviceHealth: {},
  setInitialized: (initialized) => set({ initialized }),
  setLocation: (location) => set({ location }),
  setNetwork: (network) => set({ network }),
  setDeviceState: (deviceState) => set({ deviceState }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setServiceHealth: (serviceHealth) => set({ serviceHealth }),
}));
