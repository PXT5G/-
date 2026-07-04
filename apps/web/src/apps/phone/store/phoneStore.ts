import { create } from 'zustand';
import type { PhoneTab, ActiveCallState, IncomingCallPayload } from '../types';

interface PhoneState {
  activeTab: PhoneTab;
  loading: boolean;
  permissions: string[];
  activeCall: ActiveCallState | null;
  incomingCall: IncomingCallPayload | null;
  dialInput: string;
  setTab: (tab: PhoneTab) => void;
  setLoading: (v: boolean) => void;
  setPermissions: (p: string[]) => void;
  setActiveCall: (call: ActiveCallState | null) => void;
  setIncomingCall: (call: IncomingCallPayload | null) => void;
  setDialInput: (input: string) => void;
  appendDial: (digit: string) => void;
  clearDial: () => void;
}

export const usePhoneStore = create<PhoneState>((set) => ({
  activeTab: 'dashboard',
  loading: true,
  permissions: [],
  activeCall: null,
  incomingCall: null,
  dialInput: '',
  setTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),
  setPermissions: (permissions) => set({ permissions }),
  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setDialInput: (dialInput) => set({ dialInput }),
  appendDial: (digit) => set((s) => ({ dialInput: s.dialInput + digit })),
  clearDial: () => set({ dialInput: '' }),
}));
