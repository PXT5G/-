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
import { unlockAnimation } from '@/animations/transitions';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/utils/cn';
import { useState, useEffect } from 'react';

const CLOCK_FONT_CLASSES: Record<string, string> = {
  system: 'font-display font-semibold',
  rounded: 'font-display font-bold',
  serif: 'font-serif font-medium',
  mono: 'font-mono font-medium',
  condensed: 'font-display font-bold tracking-tighter',
};

const CLOCK_COLOR_CLASSES: Record<string, string> = {
  white: 'text-white',
  gold: 'text-gulf-gold',
  blue: 'text-[#9BC4E8]',
  green: 'text-[#A8D5A2]',
  red: 'text-[#E8A09B]',
  gradient: 'bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent',
};

/** iOS 18 lock screen — iPhone 16 Pro Max layout */
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

  const clockFont = CLOCK_FONT_CLASSES[profile?.clockFont ?? 'system'] ?? CLOCK_FONT_CLASSES.system;
  const clockColor = CLOCK_COLOR_CLASSES[profile?.clockColor ?? 'white'] ?? CLOCK_COLOR_CLASSES.white;
  const lockWidgets = profile?.lockScreenWidgets ?? [];
  const showChargingAnim = profile?.chargingAnimation && battery?.isCharging;

  useEffect(() => {
    // Clock shows HH:MM — 10s resolution is indistinguishable
    const interval = setInterval(() => setTime(new Date()), 10_000);
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
      data-testid="gulfos-lock-screen"
      className="absolute inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : unlockAnimation.lockScreen.exit}
      transition={shouldReduceMotion ? { duration: 0.01 } : { duration: unlockDuration, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
      {...gestures}
    >
      {showChargingAnim && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-ios-green/20 to-transparent" />
        </motion.div>
      )}

      {/* ─── Clock block ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-8 pt-[76px]">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Padlock glyph */}
          <svg width="21" height="27" viewBox="0 0 21 27" fill="white" className="mx-auto mb-4 opacity-90" aria-hidden>
            <rect x="1" y="11" width="19" height="15" rx="4.5" />
            <path d="M5.5 11V7.5a5 5 0 0110 0V11" stroke="white" strokeWidth="2.6" fill="none" />
          </svg>
          <p className="text-[22px] font-medium text-white/95 font-display tracking-[-0.01em] mb-0">
            {formatDate(time)}
          </p>
          <h1 className={cn('text-[104px] leading-[1.02] tracking-[-0.03em] tabular-nums', clockFont, clockColor)}>
            {formatTime(time)}
          </h1>
          {battery && (lockScreen?.showChargingIndicator ?? true) && battery.isCharging && (
            <p className="text-[15px] font-medium text-ios-green mt-1">
              Charging — {Math.round(battery.level)}%
            </p>
          )}
        </motion.div>

        {/* Inline widgets under clock */}
        {lockWidgets.length > 0 && (
          <motion.div
            className="mt-5 flex justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {lockWidgets.slice(0, 4).map((w, i) => (
              <div key={`${w.type}-${i}`} className="ios-material-widget rounded-[22px] p-3 min-w-[72px]">
                <WidgetContent type={w.type} size="small" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Notification stack */}
        {notifications.length > 0 && (lockScreen?.showNotifications ?? true) && (
          <motion.div
            className="mt-auto mb-4 w-full max-w-[382px] mx-auto space-y-[9px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {notifications.map((n) => (
              <div key={n.id} className="ios-material-thin rounded-[24px] px-4 py-[13px] ios-card-shadow">
                <div className="flex items-center gap-3">
                  <span className="text-[26px] leading-none">{n.icon ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white truncate leading-tight">{n.title}</p>
                    <p className="text-[15px] text-white/75 truncate leading-tight">{n.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ─── Bottom controls ─────────────────────────────────────────── */}
      <div className="relative px-[52px] pb-[26px]">
        {unlockMethod === 'pin' && <LockScreenPIN onSuccess={handleUnlock} />}
        {unlockMethod === 'face' && <LockScreenBiometric type="face" onSuccess={handleUnlock} />}
        {unlockMethod === 'fingerprint' && <LockScreenBiometric type="fingerprint" onSuccess={handleUnlock} />}

        {!unlockMethod && (
          <>
            {/* Corner quick actions — flashlight left, camera right */}
            <motion.div
              className="flex justify-between items-end mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <button
                onClick={() => { tap(); updateSettings({ flashlightEnabled: !flashlightEnabled }); }}
                className={cn(
                  'w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-90',
                  flashlightEnabled ? 'bg-white text-black' : 'ios-material-thin text-white',
                )}
                aria-label="Flashlight"
              >
                <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden>
                  <path d="M5 0h10v3.5L12.5 8v13a3 3 0 01-2.5 3 3 3 0 01-2.5-3V8L5 3.5V0z" opacity="0.9" />
                  <rect x="9" y="10" width="2" height="4" rx="1" fill={flashlightEnabled ? '#fff' : '#000'} opacity="0.5" />
                </svg>
              </button>
              <button
                onClick={() => { tap(); void launchApp({ bundleId: 'com.gulfos.camera', name: 'Camera' }); }}
                className="w-[52px] h-[52px] rounded-full ios-material-thin text-white flex items-center justify-center transition-all active:scale-90"
                aria-label="Quick camera"
              >
                <svg width="24" height="20" viewBox="0 0 24 20" fill="currentColor" aria-hidden>
                  <path d="M8 0h8l1.5 3H21a3 3 0 013 3v11a3 3 0 01-3 3H3a3 3 0 01-3-3V6a3 3 0 013-3h3.5L8 0z" opacity="0.9" />
                  <circle cx="12" cy="11" r="4.5" fill="#000" opacity="0.55" />
                </svg>
              </button>
            </motion.div>

            {/* Unlock method shortcuts (GULFOS security options) */}
            <motion.div
              className="flex justify-center gap-7 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              {([['pin', 'PIN'], ['face', 'Face ID'], ['fingerprint', 'Touch ID']] as const).map(([method, label]) => (
                <button
                  key={method}
                  onClick={() => useLockStore.getState().startUnlock(method)}
                  className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                  aria-label={`Unlock with ${label}`}
                >
                  {label}
                </button>
              ))}
            </motion.div>

            {/* Home indicator + hint */}
            <motion.div
              className="text-center"
              animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-[15px] font-medium text-white/80 mb-3">Swipe up to unlock</p>
              <div className="mx-auto w-[148px] h-[5px] rounded-full bg-white" />
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
