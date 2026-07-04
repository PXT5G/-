'use client';

import { type ReactNode } from 'react';
import { useThemeEngine } from '@/hooks/useThemeEngine';
import { useRealtime } from '@/hooks/useRealtime';
import { useOSBoot } from '@/hooks/useOSBoot';
import '@/services/registerSystemApps';

function OSInitializer() {
  useThemeEngine();
  useRealtime();
  useOSBoot();
  return null;
}

export function OSProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <OSInitializer />
      {children}
    </>
  );
}
