const STORAGE_PREFIX = 'gulfos_';
const LEGACY_STORAGE_PREFIX = 'bananaos_';

function migrateLegacyStorageKeys(): void {
  if (typeof window === 'undefined') return;
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(LEGACY_STORAGE_PREFIX)) continue;
    const suffix = key.slice(LEGACY_STORAGE_PREFIX.length);
    const newKey = `${STORAGE_PREFIX}${suffix}`;
    if (localStorage.getItem(newKey) == null) {
      localStorage.setItem(newKey, localStorage.getItem(key)!);
    }
  }
  for (const key of Object.keys(sessionStorage)) {
    if (!key.startsWith(LEGACY_STORAGE_PREFIX)) continue;
    const suffix = key.slice(LEGACY_STORAGE_PREFIX.length);
    const newKey = `${STORAGE_PREFIX}${suffix}`;
    if (sessionStorage.getItem(newKey) == null) {
      sessionStorage.setItem(newKey, sessionStorage.getItem(key)!);
    }
  }
}

if (typeof window !== 'undefined') {
  migrateLegacyStorageKeys();
}

export const storage = {
  get<T>(key: string, fallback?: T): T | undefined {
    if (typeof window === 'undefined') return fallback;
    try {
      let item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (item == null) {
        item = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${key}`);
      }
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
    localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${key}`);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX) || k.startsWith(LEGACY_STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export const sessionStorage_ = {
  get<T>(key: string, fallback?: T): T | undefined {
    if (typeof window === 'undefined') return fallback;
    try {
      let item = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (item == null) {
        item = sessionStorage.getItem(`${LEGACY_STORAGE_PREFIX}${key}`);
      }
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
    sessionStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${key}`);
  },
};
