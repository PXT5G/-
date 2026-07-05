'use client';

import { useAuthStore } from '@/stores/authStore';

export function useGulfStoreAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.getAccessToken());

  return {
    storeReady: isAuthenticated && Boolean(accessToken),
    accessToken,
  };
}
