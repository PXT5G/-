'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLockStore } from '@/stores/lockStore';
import { useHaptic } from '@/hooks/useSound';

interface LockScreenBiometricProps {
  type: 'face' | 'fingerprint';
  onSuccess: () => void;
}

export function LockScreenBiometric({ type, onSuccess }: LockScreenBiometricProps) {
  const { faceUnlockProgress, fingerprintProgress, setFaceUnlockProgress, setFingerprintProgress } =
    useLockStore();
  const { tap, success: hapticSuccess } = useHaptic();

  const progress = type === 'face' ? faceUnlockProgress : fingerprintProgress;
  const setProgress = type === 'face' ? setFaceUnlockProgress : setFingerprintProgress;

  useEffect(() => {
    tap();
    const interval = setInterval(() => {
      const current = type === 'face' ? useLockStore.getState().faceUnlockProgress : useLockStore.getState().fingerprintProgress;
      if (current >= 100) {
        clearInterval(interval);
        hapticSuccess();
        setTimeout(onSuccess, 300);
        return;
      }
      setProgress(current + 5);
    }, 80);

    return () => clearInterval(interval);
  }, [type, setProgress, onSuccess, tap, hapticSuccess]);

  return (
    <motion.div
      className="flex flex-col items-center py-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="relative w-20 h-20 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={226}
            animate={{ strokeDashoffset: 226 - (226 * progress) / 100 }}
            transition={{ duration: 0.1 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl">
          {type === 'face' ? '👤' : '👆'}
        </span>
      </div>
      <p className="text-sm text-white/70">
        {type === 'face' ? 'Scanning face...' : 'Verifying fingerprint...'}
      </p>
      <p className="text-xs text-white/40 mt-1">{progress}%</p>
    </motion.div>
  );
}
