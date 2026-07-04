import { create } from 'zustand';
import type {
  WorldStateSnapshot,
  CellTowerSnapshot,
  SignalSnapshot,
  GpsStateSnapshot,
  VpnStateSnapshot,
  CarrierStateSnapshot,
} from '@/types';

interface WorldStoreState {
  world: WorldStateSnapshot | null;
  tower: CellTowerSnapshot | null;
  signal: SignalSnapshot | null;
  gps: GpsStateSnapshot | null;
  vpn: VpnStateSnapshot | null;
  carrier: CarrierStateSnapshot | null;
  setWorld: (v: WorldStateSnapshot) => void;
  setTower: (v: CellTowerSnapshot) => void;
  setSignal: (v: SignalSnapshot) => void;
  setGps: (v: GpsStateSnapshot) => void;
  setVpn: (v: VpnStateSnapshot) => void;
  setCarrier: (v: CarrierStateSnapshot) => void;
}

export const useWorldStore = create<WorldStoreState>((set) => ({
  world: null,
  tower: null,
  signal: null,
  gps: null,
  vpn: null,
  carrier: null,
  setWorld: (world) => set({ world }),
  setTower: (tower) => set({ tower }),
  setSignal: (signal) => set({ signal }),
  setGps: (gps) => set({ gps }),
  setVpn: (vpn) => set({ vpn }),
  setCarrier: (carrier) => set({ carrier }),
}));
