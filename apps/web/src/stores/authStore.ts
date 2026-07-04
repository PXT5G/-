import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@/types';
import { storage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (tokens) => {
        set({ tokens });
        if (tokens) {
          storage.set('tokens', tokens);
        } else {
          storage.remove('tokens');
        }
      },

      login: (user, tokens) => {
        set({ user, tokens, isAuthenticated: true });
        storage.set('tokens', tokens);
      },

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
        storage.remove('tokens');
      },

      setLoading: (isLoading) => set({ isLoading }),

      getAccessToken: () => get().tokens?.accessToken ?? null,
    }),
    { name: 'bananaos-auth' }
  )
);
