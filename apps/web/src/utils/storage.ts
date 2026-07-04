const STORAGE_PREFIX = 'bananaos_';

export const storage = {
  get<T>(key: string, fallback?: T): T | undefined {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('[Storage] Failed to save:', key, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export const sessionStorage_ = {
  get<T>(key: string, fallback?: T): T | undefined {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },
};
