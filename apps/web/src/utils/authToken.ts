import { useAuthStore } from '@/stores/authStore';
import { storage } from '@/utils/storage';
import type { AuthTokens } from '@/types';

const AUTH_PERSIST_KEYS = ['gulfos-auth', 'bananaos-auth', 'gulfos_gulfos-auth'] as const;

function readTokenFromPersistedAuth(raw: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { state?: { tokens?: AuthTokens } };
    return parsed?.state?.tokens?.accessToken;
  } catch {
    return undefined;
  }
}

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const fromStore = useAuthStore.getState().getAccessToken();
  if (fromStore) return fromStore;

  const fromStorage = storage.get<AuthTokens>('tokens');
  if (fromStorage?.accessToken) return fromStorage.accessToken;

  for (const key of AUTH_PERSIST_KEYS) {
    const token = readTokenFromPersistedAuth(localStorage.getItem(key));
    if (token) return token;
  }

  return undefined;
}
