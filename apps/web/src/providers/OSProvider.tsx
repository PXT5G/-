'use client';

import { type ReactNode } from 'react';
import { useThemeEngine } from '@/hooks/useThemeEngine';
import { useRealtime } from '@/hooks/useRealtime';
import { useOSBoot } from '@/hooks/useOSBoot';
import { useInstalledAppsHydration } from '@/hooks/useInstalledAppsHydration';
import { useSystemInit } from '@/hooks/useSystemServices';
import { useCommunicationInit } from '@/hooks/useCommunicationServices';
import { useDeviceEcosystemInit } from '@/hooks/useDeviceEcosystem';
import { useSystemAppsInit } from '@/hooks/useSystemApps';
import { usePoliceInit } from '@/hooks/usePolice';
import { useSettingsInit } from '@/hooks/useSettings';
import { usePhoneOsInit, usePhoneOsRealtime } from '@/hooks/usePhoneOs';
import '@/services/registerSystemApps';

function OSInitializer() {
  useThemeEngine();
  useRealtime();
  useOSBoot();
  useInstalledAppsHydration();
  useSystemInit();
  useCommunicationInit();
  useDeviceEcosystemInit();
  useSystemAppsInit();
  useSettingsInit();
  usePoliceInit();
  usePhoneOsInit();
  usePhoneOsRealtime();
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
