'use client';

import { useCallback } from 'react';
import { useSoundStore } from '@/stores/soundStore';
import { useHapticStore } from '@/stores/hapticStore';
import type { HapticPattern } from '@/types';

export function useSound() {
  const { play, stop, enabled, volume, setEnabled, setVolume } = useSoundStore();

  const playTap = useCallback(() => play('tap'), [play]);
  const playUnlock = useCallback(() => play('unlock'), [play]);
  const playLock = useCallback(() => play('lock'), [play]);
  const playNotification = useCallback(() => play('notification'), [play]);

  return { play, stop, playTap, playUnlock, playLock, playNotification, enabled, volume, setEnabled, setVolume };
}

export function useHaptic() {
  const { trigger, enabled, setEnabled } = useHapticStore();

  const tap = useCallback(() => trigger('light'), [trigger]);
  const press = useCallback(() => trigger('medium'), [trigger]);
  const impact = useCallback(() => trigger('heavy'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const custom = useCallback((type: HapticPattern['type']) => trigger(type), [trigger]);

  return { tap, press, impact, success, error, custom, enabled, setEnabled };
}
