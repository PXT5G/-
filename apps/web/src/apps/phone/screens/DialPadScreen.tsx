'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { usePhoneStore } from '../store/phoneStore';
import { phoneService } from '../services/phoneService';
import { useHaptic } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PhoneIcon } from '@/components/shared/PhoneIcons';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export function DialPadScreen() {
  const dialInput = usePhoneStore((s) => s.dialInput);
  const appendDial = usePhoneStore((s) => s.appendDial);
  const clearDial = usePhoneStore((s) => s.clearDial);
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const callMutation = useMutation({
    mutationFn: (number: string) => phoneService.makeCall(number),
    onSuccess: (data) => {
      setCallError(null);
      setActiveCall(data.activeCall);
      setTab('active');
      queryClient.invalidateQueries({ queryKey: ['phone'] });
      success();
    },
    onError: (err: Error) => {
      setCallError(err.message || 'Call failed');
    },
  });

  const handleCall = async () => {
    if (!dialInput.trim()) return;
    tap();
    setCalling(true);
    try {
      await callMutation.mutateAsync(dialInput);
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-between py-6 px-4">
      {callError && (
        <p className="text-red-400 text-xs text-center px-4 mb-2" role="alert">{callError}</p>
      )}
      <div className="flex-1 flex items-center justify-center min-h-[60px]">
        <motion.p
          key={dialInput}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl font-light tracking-widest font-mono"
          aria-live="polite"
          aria-label={dialInput ? `Dialing ${dialInput}` : 'Enter number'}
        >
          {dialInput || 'Enter number'}
        </motion.p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]" role="group" aria-label="Dial pad">
        {KEYS.flat().map((key) => (
          <motion.button
            key={key}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            onClick={() => { tap(); appendDial(key); }}
            className="w-16 h-16 min-w-[44px] min-h-[44px] mx-auto rounded-full bg-white/5 border border-white/10 text-white text-2xl font-light backdrop-blur-xl"
            aria-label={`Dial ${key}`}
          >
            {key}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-8 mt-6">
        {dialInput && (
          <button type="button" onClick={() => { tap(); clearDial(); }} className="text-white/40 text-sm min-h-[44px] px-2" aria-label="Clear number">
            Clear
          </button>
        )}
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
          onClick={handleCall}
          disabled={!dialInput || calling}
          className="w-16 h-16 min-w-[44px] min-h-[44px] rounded-full bg-banana-gold flex items-center justify-center shadow-lg shadow-banana-gold/40 disabled:opacity-40 text-black"
          aria-label="Place call"
        >
          <PhoneIcon className="w-7 h-7" />
        </motion.button>
      </div>
    </div>
  );
}
