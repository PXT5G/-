'use client';

import { useEffect, useCallback } from 'react';
import { useOSStore } from '@/stores/osStore';
import { useSoundStore } from '@/stores/soundStore';

const BOOT_STEPS = [
  { progress: 15, label: 'Initializing kernel' },
  { progress: 30, label: 'Loading drivers' },
  { progress: 50, label: 'Starting services' },
  { progress: 70, label: 'Mounting filesystem' },
  { progress: 85, label: 'Loading UI framework' },
  { progress: 100, label: 'Ready' },
];

export function useOSBoot() {
  const { phase, setPhase, setBootProgress, completeBoot } = useOSStore();
  const playSound = useSoundStore((s) => s.play);

  const startBoot = useCallback(() => {
    setPhase('booting');
    playSound('boot');

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= BOOT_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          completeBoot();
        }, 500);
        return;
      }

      const step = BOOT_STEPS[stepIndex];
      setBootProgress(step.progress);
      stepIndex += 1;
    }, 450);

    return () => clearInterval(interval);
  }, [setPhase, setBootProgress, completeBoot, playSound]);

  useEffect(() => {
    if (phase === 'splash') {
      const timer = setTimeout(() => {
        startBoot();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, startBoot]);

  return { phase, startBoot };
}
