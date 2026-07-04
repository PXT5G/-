'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { usePhoneStore } from '../store/phoneStore';
import { phoneService } from '../services/phoneService';
import { useHaptic } from '@/hooks/useSound';

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
  const [calling, setCalling] = useState(false);

  const callMutation = useMutation({
    mutationFn: (number: string) => phoneService.makeCall(number),
    onSuccess: (data) => {
      setActiveCall(data.activeCall);
      setTab('active');
      queryClient.invalidateQueries({ queryKey: ['phone'] });
      success();
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
      <div className="flex-1 flex items-center justify-center min-h-[60px]">
        <motion.p
          key={dialInput}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl font-light tracking-widest font-mono"
        >
          {dialInput || 'Enter number'}
        </motion.p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {KEYS.flat().map((key) => (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => { tap(); appendDial(key); }}
            className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 text-white text-2xl font-light backdrop-blur-xl"
          >
            {key}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-8 mt-6">
        {dialInput && (
          <button type="button" onClick={() => { tap(); clearDial(); }} className="text-white/40 text-sm">
            Clear
          </button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={handleCall}
          disabled={!dialInput || calling}
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl shadow-lg shadow-green-500/40 disabled:opacity-40"
        >
          📞
        </motion.button>
      </div>
    </div>
  );
}
