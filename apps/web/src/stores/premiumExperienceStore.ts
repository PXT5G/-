import { create } from 'zustand';
import type { PremiumExperienceSnapshot, NotificationHistorySnapshot } from '@/types';

interface PremiumExperienceState {
  profile: PremiumExperienceSnapshot | null;
  notificationHistory: NotificationHistorySnapshot[];
  isAppLibraryOpen: boolean;
  appLibrary: Record<string, unknown> | null;
  setProfile: (profile: PremiumExperienceSnapshot) => void;
  setNotificationHistory: (history: NotificationHistorySnapshot[]) => void;
  setAppLibraryOpen: (open: boolean) => void;
  setAppLibrary: (data: Record<string, unknown>) => void;
  hydrate: (profile: PremiumExperienceSnapshot) => void;
}

export const usePremiumExperienceStore = create<PremiumExperienceState>((set) => ({
  profile: null,
  notificationHistory: [],
  isAppLibraryOpen: false,
  appLibrary: null,

  setProfile: (profile) => set({ profile }),
  setNotificationHistory: (notificationHistory) => set({ notificationHistory }),
  setAppLibraryOpen: (isAppLibraryOpen) => set({ isAppLibraryOpen }),
  setAppLibrary: (appLibrary) => set({ appLibrary }),
  hydrate: (profile) => set({ profile }),
}));
