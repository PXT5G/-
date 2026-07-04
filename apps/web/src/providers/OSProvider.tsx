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
import { usePhoneOsInit, usePhoneOsRealtime, useLiveActivitiesHydration } from '@/hooks/usePhoneOs';
import { usePremiumExperienceInit, usePremiumExperienceRealtime } from '@/hooks/usePremiumExperience';
import { usePhoneRealtime } from '@/hooks/usePhone';
import { useBankSocketSync } from '@/hooks/useBank';
import { useIdentitySocketSync } from '@/hooks/useIdentity';
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
  usePremiumExperienceInit();
  usePremiumExperienceRealtime();
  usePhoneRealtime();
  useBankSocketSync();
  useIdentitySocketSync();
  useLiveActivitiesHydration();
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
