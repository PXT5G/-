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
      <p className="text-sm text-white/70 mb-4">Enter PIN</p>

      <div className="flex gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full border-2 transition-all',
              i < entered.length
                ? 'bg-gulf-gold border-gulf-gold'
                : 'border-white/30'
            )}
          />
        ))}
      </div>

      {pinAttempts > 0 && (
        <p className="text-xs text-red-400 mb-4">
          {maxPinAttempts - pinAttempts} attempts remaining
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
          <button
            key={key || 'empty'}
            onClick={() => (key === 'del' ? handleDelete() : key && handleDigit(key))}
            disabled={!key}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center text-xl font-light text-white transition-all',
              key ? 'bg-white/10 hover:bg-white/20 active:scale-95' : 'invisible'
            )}
            aria-label={key === 'del' ? 'Delete' : key || undefined}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
