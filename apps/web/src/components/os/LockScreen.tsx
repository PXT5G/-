'use client';

import { motion } from 'framer-motion';
import { formatTime, formatDate } from '@/utils/date';
import { useLockStore } from '@/stores/lockStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useGestures } from '@/hooks/useGestures';
import { useSound, useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { useOSStore } from '@/stores/osStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { LockScreenPIN } from './LockScreenPIN';
import { LockScreenBiometric } from './LockScreenBiometric';
import { WidgetContent } from '@/components/widgets/WidgetContent';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { unlockAnimation } from '@/animations/transitions';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/utils/cn';
import { useState, useEffect } from 'react';

const CLOCK_FONT_CLASSES: Record<string, string> = {
  system: 'font-extralight',
  rounded: 'font-light tracking-wide',
  serif: 'font-serif font-light',
  mono: 'font-mono font-light',
  condensed: 'font-sans font-thin tracking-tighter',
};

const CLOCK_COLOR_CLASSES: Record<string, string> = {
  white: 'text-white',
  gold: 'text-gulf-gold',
  blue: 'text-blue-300',
  green: 'text-green-300',
  red: 'text-red-300',
  gradient: 'bg-gradient-to-r from-gulf-gold to-white bg-clip-text text-transparent',
};

export function LockScreen() {
  const [time, setTime] = useState(new Date());
  const { unlockMethod, unlock } = useLockStore();
  const allNotifications = useNotificationStore((s) => s.notifications);
  const notifications = allNotifications.slice(0, 3);
  const profile = usePremiumExperienceStore((s) => s.profile);
  const lockScreen = usePhoneOsStore((s) => s.lockScreen);
  const battery = usePhoneOsStore((s) => s.battery);
  const setPhase = useOSStore((s) => s.setPhase);
  const flashlightEnabled = useSettingsStore((s) => s.flashlightEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { playUnlock } = useSound();
  const { success: hapticSuccess, tap } = useHaptic();
  const { launchApp } = useAppLaunch();
  const { unlockDuration, shouldReduceMotion } = useMotionPreference();

  const layout = profile?.lockScreenLayout ?? 'classic';
  const clockFont = CLOCK_FONT_CLASSES[profile?.clockFont ?? 'system'] ?? CLOCK_FONT_CLASSES.system;
  const clockColor = CLOCK_COLOR_CLASSES[profile?.clockColor ?? 'white'] ?? CLOCK_COLOR_CLASSES.white;
  const lockWidgets = profile?.lockScreenWidgets ?? [];
  const blurIntensity = profile?.blurIntensity ?? 20;
  const showChargingAnim = profile?.chargingAnimation && battery?.isCharging;

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
      if (!unlockMethod) handleUnlock();
    },
  });

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : unlockAnimation.lockScreen.exit}
      transition={shouldReduceMotion ? { duration: 0.01 } : { duration: unlockDuration, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
      {...gestures}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backdropFilter: `blur(${blurIntensity}px)` }}
      />

      {showChargingAnim && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-500/20 to-transparent" />
        </motion.div>
      )}

      <div className={cn('flex-1 flex flex-col px-6 pt-16', layout === 'split' && 'flex-row gap-4')}>
        <motion.div
          className={cn('text-center', layout === 'minimal' && 'pt-8', layout === 'split' && 'flex-1')}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm font-medium text-white/70 mb-1">{formatDate(time)}</p>
          <h1 className={cn('text-7xl tracking-tight tabular-nums', clockFont, clockColor)}>
            {formatTime(time)}
          </h1>
          {battery && (lockScreen?.showChargingIndicator ?? true) && (
            <p className="text-xs text-white/50 mt-2">
              {battery.isCharging ? '⚡' : '🔋'} {Math.round(battery.level)}%
            </p>
          )}
        </motion.div>

        {lockWidgets.length > 0 && (
          <motion.div
            className={cn(
              'mt-6 grid gap-2',
              layout === 'stacked' ? 'grid-cols-1 max-w-sm mx-auto w-full' : 'grid-cols-2 max-w-sm mx-auto w-full'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {lockWidgets.slice(0, 4).map((w, i) => (
              <GlassPanel key={`${w.type}-${i}`} className="p-3" intensity="low">
                <WidgetContent type={w.type} size="small" />
              </GlassPanel>
            ))}
          </motion.div>
        )}

        {notifications.length > 0 && (lockScreen?.showNotifications ?? true) && (
          <motion.div
            className="mt-6 w-full max-w-sm mx-auto space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {notifications.map((n) => (
              <GlassPanel key={n.id} className="p-3" intensity="low">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{n.icon ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                    <p className="text-xs text-white/60 truncate">{n.body}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8">
        <motion.div
          className="flex justify-center gap-8 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => { tap(); void launchApp({ bundleId: 'com.gulfos.camera', name: 'Camera' }); }}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white"
            aria-label="Quick camera"
          >
            <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-xl">📷</span>
            <span className="text-[10px]">Camera</span>
          </button>
          <button
            onClick={() => { tap(); updateSettings({ flashlightEnabled: !flashlightEnabled }); }}
            className={cn(
              'flex flex-col items-center gap-1 transition-colors',
              flashlightEnabled ? 'text-gulf-gold' : 'text-white/60 hover:text-white'
            )}
            aria-label="Flashlight"
          >
            <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-xl">🔦</span>
            <span className="text-[10px]">Flashlight</span>
          </button>
        </motion.div>

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
