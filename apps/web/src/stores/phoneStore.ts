import { create } from 'zustand';

interface PhoneState {
  activeCall: Record<string, unknown> | null;
  incomingCall: Record<string, unknown> | null;
  setActiveCall: (call: Record<string, unknown> | null) => void;
  setIncomingCall: (call: Record<string, unknown> | null) => void;
}

export const usePhoneStore = create<PhoneState>((set) => ({
  activeCall: null,
  incomingCall: null,
  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
}));
