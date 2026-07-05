import { create } from 'zustand';
import type {
  DeviceProfileSnapshot,
  PowerStateSnapshot,
  SecurityConfigSnapshot,
  SyncStatusSnapshot,
  RecoveryStateSnapshot,
} from '@/types';

interface DeviceEcosystemState {
  profile: DeviceProfileSnapshot | null;
  power: PowerStateSnapshot | null;
  security: SecurityConfigSnapshot | null;
  syncStatus: SyncStatusSnapshot | null;
  recovery: RecoveryStateSnapshot | null;
  ready: boolean;
  setProfile: (profile: DeviceProfileSnapshot) => void;
  setPower: (power: PowerStateSnapshot) => void;
  setSecurity: (security: SecurityConfigSnapshot) => void;
  setSyncStatus: (status: SyncStatusSnapshot) => void;
  setRecovery: (recovery: RecoveryStateSnapshot) => void;
  setReady: (ready: boolean) => void;
}

export const useDeviceEcosystemStore = create<DeviceEcosystemState>((set) => ({
  profile: null,
  power: null,
  security: null,
  syncStatus: null,
  recovery: null,
  ready: false,
  setProfile: (profile) => set({ profile }),
  setPower: (power) => set({ power }),
  setSecurity: (security) => set({ security }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setRecovery: (recovery) => set({ recovery }),
  setReady: (ready) => set({ ready }),
}));
