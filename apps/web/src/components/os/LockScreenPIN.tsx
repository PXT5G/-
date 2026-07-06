'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLockStore } from '@/stores/lockStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

interface LockScreenPINProps {
  onSuccess: () => void;
}

export function LockScreenPIN({ onSuccess }: LockScreenPINProps) {
  const [entered, setEntered] = useState('');
  const { verifyPin, pinAttempts, maxPinAttempts, setPin } = useLockStore();
  const { tap, error: hapticError, success: hapticSuccess } = useHaptic();

  const handleDigit = (digit: string) => {
    tap();
    if (entered.length >= 6) return;

    const newPin = entered + digit;
    setEntered(newPin);

    if (newPin.length === 4 || newPin.length === 6) {
      if (!useLockStore.getState().pin) {
        setPin(newPin);
        hapticSuccess();
        onSuccess();
        return;
      }

      const valid = verifyPin(newPin);
      if (valid) {
        hapticSuccess();
        onSuccess();
      } else {
        hapticError();
        setEntered('');
      }
    }
  };

  const handleDelete = () => {
    tap();
    setEntered((p) => p.slice(0, -1));
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-[17px] font-medium text-white mb-5">Enter Passcode</p>

      <div className="flex gap-[22px] mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-[13px] h-[13px] rounded-full border transition-all',
              i < entered.length
                ? 'bg-white border-white'
                : 'border-white/60'
            )}
          />
        ))}
      </div>

      {pinAttempts > 0 && (
        <p className="text-[13px] text-ios-red mb-4">
          {maxPinAttempts - pinAttempts} attempts remaining
        </p>
      )}

      {/* iOS passcode keypad — 78pt circles */}
      <div className="grid grid-cols-3 gap-x-[26px] gap-y-[16px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
          <button
            key={key || 'empty'}
            onClick={() => (key === 'del' ? handleDelete() : key && handleDigit(key))}
            disabled={!key}
            className={cn(
              'w-[78px] h-[78px] rounded-full flex items-center justify-center transition-all',
              key && key !== 'del' && 'ios-material-ultrathin text-white active:bg-white/40',
              key === 'del' && 'text-white/80 active:opacity-50',
              !key && 'invisible'
            )}
            aria-label={key === 'del' ? 'Delete' : key || undefined}
          >
            {key === 'del' ? (
              <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor" aria-hidden>
                <path d="M9 0h16a3 3 0 013 3v14a3 3 0 01-3 3H9L0 10 9 0z" opacity="0.35" />
                <path d="M13 6l8 8M21 6l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-[32px] font-light font-display leading-none">{key}</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
