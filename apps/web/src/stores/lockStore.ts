import { create } from 'zustand';
import type { UnlockMethod } from '@/types';

interface LockState {
  isLocked: boolean;
  pin: string | null;
  pinAttempts: number;
  maxPinAttempts: number;
  unlockMethod: UnlockMethod | null;
  isUnlocking: boolean;
  faceUnlockProgress: number;
  fingerprintProgress: number;
  lock: () => void;
  unlock: () => void;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  startUnlock: (method: UnlockMethod) => void;
  setFaceUnlockProgress: (progress: number) => void;
  setFingerprintProgress: (progress: number) => void;
  completeUnlock: () => void;
  resetAttempts: () => void;
}

export const useLockStore = create<LockState>((set, get) => ({
  isLocked: true,
  pin: null,
  pinAttempts: 0,
  maxPinAttempts: 5,
  unlockMethod: null,
  isUnlocking: false,
  faceUnlockProgress: 0,
  fingerprintProgress: 0,

  lock: () => set({ isLocked: true, isUnlocking: false, unlockMethod: null }),

  unlock: () =>
    set({
      isLocked: false,
      isUnlocking: false,
      unlockMethod: null,
      faceUnlockProgress: 0,
      fingerprintProgress: 0,
      pinAttempts: 0,
    }),

  setPin: (pin) => set({ pin }),

  verifyPin: (enteredPin) => {
    const { pin, pinAttempts, maxPinAttempts } = get();
    if (!pin) return false;
    if (enteredPin === pin) {
      set({ pinAttempts: 0 });
      return true;
    }
    set({ pinAttempts: pinAttempts + 1 });
    return pinAttempts + 1 < maxPinAttempts;
  },

  startUnlock: (unlockMethod) => set({ unlockMethod, isUnlocking: true }),

  setFaceUnlockProgress: (faceUnlockProgress) => set({ faceUnlockProgress }),

  setFingerprintProgress: (fingerprintProgress) => set({ fingerprintProgress }),

  completeUnlock: () => set({ isUnlocking: false }),

  resetAttempts: () => set({ pinAttempts: 0 }),
}));
