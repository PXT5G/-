'use client';

import { motion } from 'framer-motion';
import { formatTime, formatDate } from '@/utils/date';
import { useLockStore } from '@/stores/lockStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useGestures } from '@/hooks/useGestures';
import { useSound, useHaptic } from '@/hooks/useSound';
import { useOSStore } from '@/stores/osStore';
import { LockScreenPIN } from './LockScreenPIN';
import { LockScreenBiometric } from './LockScreenBiometric';
import { useState, useEffect, useMemo } from 'react';

export function LockScreen() {
  const [time, setTime] = useState(new Date());
  const { unlockMethod, unlock } = useLockStore();
  const allNotifications = useNotificationStore((s) => s.notifications);
  const notifications = useMemo(() => allNotifications.slice(0, 3), [allNotifications]);
  const setPhase = useOSStore((s) => s.setPhase);
  const { playUnlock } = useSound();
  const { success: hapticSuccess } = useHaptic();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    playUnlock();
    hapticSuccess();
    unlock();
    setPhase('home');
  };

  const gestures = useGestures({
    onSwipeUp: () => {
      if (!unlockMethod) {
        handleUnlock();
      }
    },
  });

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      {...gestures}
    >
      <div className="flex-1 flex flex-col items-center pt-16 px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm font-medium text-white/70 mb-1">{formatDate(time)}</p>
          <h1 className="text-7xl font-extralight text-white tracking-tight tabular-nums">
            {formatTime(time)}
          </h1>
        </motion.div>

        {notifications.length > 0 && (
          <motion.div
            className="mt-8 w-full max-w-sm space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{n.icon ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                    <p className="text-xs text-white/60 truncate">{n.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8">
        {unlockMethod === 'pin' && <LockScreenPIN onSuccess={handleUnlock} />}
        {unlockMethod === 'face' && <LockScreenBiometric type="face" onSuccess={handleUnlock} />}
        {unlockMethod === 'fingerprint' && <LockScreenBiometric type="fingerprint" onSuccess={handleUnlock} />}

        {!unlockMethod && (
          <>
            <motion.div
              className="flex justify-center gap-6 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={() => useLockStore.getState().startUnlock('pin')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
                aria-label="Unlock with PIN"
              >
                <span className="text-2xl">🔢</span>
                <span className="text-[10px]">PIN</span>
              </button>
              <button
                onClick={() => useLockStore.getState().startUnlock('face')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
                aria-label="Unlock with Face ID"
              >
                <span className="text-2xl">👤</span>
                <span className="text-[10px]">Face</span>
              </button>
              <button
                onClick={() => useLockStore.getState().startUnlock('fingerprint')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
                aria-label="Unlock with fingerprint"
              >
                <span className="text-2xl">👆</span>
                <span className="text-[10px]">Touch</span>
              </button>
            </motion.div>

            <motion.div
              className="text-center"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="mx-auto w-10 h-1 rounded-full bg-white/40 mb-2" />
              <p className="text-xs text-white/50">Swipe up to unlock</p>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
