# BananaOS Frontend Engineer — Reference

## Folder Structure

### Per-app module

```
apps/web/src/apps/<app>/
├── manifest.ts
├── index.tsx                 # App shell
├── types.ts
├── store/<app>Store.ts
├── services/<app>Service.ts
├── hooks/use<App>Realtime.ts
├── components/
│   ├── <App>TabBar.tsx
│   └── ...app-specific
├── screens/
│   ├── HomeScreen.tsx
│   └── ...
└── __tests__/<app>.test.ts
```

### Shared (reuse — never duplicate)

```
apps/web/src/
├── components/
│   ├── os/                   # StatusBar, Dock, DynamicIsland, HomeScreen
│   ├── ui/                   # GlassPanel, Toggle, Slider
│   └── shared/               # Button, EmptyState, SearchBar
├── hooks/                    # useSound, useGestures, useRealtime
├── stores/                   # authStore, osStore, windowManagerStore
├── services/                 # appRouter, realtimeService, *Api.ts
├── animations/transitions.ts
├── layouts/PhoneFrame.tsx
└── utils/api.ts              # apiRequest helper
```

Note: Use `screens/` not `pages/` — existing convention.

---

## Component Checklist

Before creating a new component:

- [ ] Does `components/shared/` or `components/ui/` already have it?
- [ ] Props interface exported and fully typed (no `any`)
- [ ] `'use client'` if using hooks, motion, or event handlers
- [ ] Uses `cn()` from `@/utils/cn` for conditional classes
- [ ] Uses design tokens (`banana-gold`, `bg-white/5`, `border-white/10`)
- [ ] `motion` components use spring transitions from `@/animations/transitions`
- [ ] Interactive elements have `type="button"` and keyboard support
- [ ] `whileTap={{ scale: 0.98 }}` on pressable cards (optional, consistent with ContactCard)
- [ ] No hardcoded hex colors
- [ ] No "Coming soon" or placeholder content

### Shared component map

| Need | Import |
|------|--------|
| Button | `@/components/shared/Button` |
| Empty state | `@/components/shared/EmptyState` |
| Search input | `@/components/shared/SearchBar` |
| Glass card | `@/components/ui/GlassPanel` |
| App icon | `@/components/os/AppIcon` |
| Skeleton | `@/apps/identity/components/SkeletonCard` (or inline spinner) |

---

## Screen Checklist

Every screen file must handle:

### 1. Loading
```tsx
if (isLoading) {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### 2. Empty
```tsx
if (!data?.length) {
  return <EmptyState icon="👤" title="No Items" description="Add your first item to get started." />;
}
```

### 3. Error
```tsx
const { data, isLoading, isError, refetch } = useQuery({ ... });
if (isError) {
  return (
    <EmptyState icon="⚠️" title="Something went wrong" description="Pull to retry or tap below.">
      <Button label="Retry" onClick={() => refetch()} />
    </EmptyState>
  );
}
```

### 4. Success / data
Render content with `motion.div` enter animation.

### 5. Realtime
Parent app calls `use<App>Realtime()` — screens use `queryKey: ['<app>', ...]`.

### 6. Pull to refresh (list screens)
```tsx
const queryClient = useQueryClient();
// On gesture or button:
queryClient.invalidateQueries({ queryKey: ['<app>'] });
```

### Screen template

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { appService } from '../services/appService';
import { EmptyState } from '@/components/shared/EmptyState';

export function ListScreen() {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['app', 'list'],
    queryFn: () => appService.list(),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState icon="⚠️" title="Error" description="Could not load data." />;
  if (!data.length) return <EmptyState icon="📋" title="Empty" description="Nothing here yet." />;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        {data.map((item) => (/* ... */))}
      </motion.div>
    </div>
  );
}
```

---

## Service Pattern

```typescript
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const appService = {
  async getDashboard(): Promise<Dashboard> {
    const res = await apiRequest<{ success: boolean; data: Dashboard }>('/api/app/dashboard', {
      token: getToken(),
    });
    return res.data!;
  },
};
```

---

## Zustand Store Pattern

```typescript
import { create } from 'zustand';

interface AppState {
  activeTab: AppTab;
  searchQuery: string;
  setTab: (tab: AppTab) => void;
  setSearchQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  searchQuery: '',
  setTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
```

---

## Realtime Hook Pattern

```typescript
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import type { SocketEvent } from '@/types';

const EVENTS: SocketEvent[] = ['app:created', 'app:updated'];

export function useAppRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!token) return;
    const unsubs = EVENTS.map((e) =>
      realtimeService.on(e, () => queryClient.invalidateQueries({ queryKey: ['app'] }))
    );
    return () => unsubs.forEach((u) => u());
  }, [token, queryClient]);
}
```

---

## Tab Bar Pattern

```tsx
import { motion } from 'framer-motion';

<motion.span
  animate={{ scale: active === tab.id ? 1.15 : 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
  {tab.icon}
</motion.span>
{active === tab.id && (
  <motion.div layoutId="app-tab" className="absolute -bottom-0.5 w-3 h-0.5 rounded-full bg-banana-gold"
    transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
)}
```

Pair with `useHaptic().tap()` on tab change.

---

## App Index Shell Pattern

```tsx
export function AppShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeTab, setTab } = useAppStore();
  useAppRealtime();

  useQuery({ queryKey: ['app', 'dashboard'], queryFn: () => appService.getDashboard(), enabled: isAuthenticated });

  if (!isAuthenticated) return <EmptyState icon="📱" title="Sign In Required" description="..." />;

  return (
    <div className="flex flex-col h-full bg-black relative">
      <header>...</header>
      <div className="flex-1 overflow-hidden">{renderScreen()}</div>
      <AppTabBar active={activeTab} onChange={setTab} />
    </div>
  );
}
```

---

## Performance Checklist

### Lazy loading & code splitting
- Apps load via `appRouter` + dynamic `getAppComponent(bundleId)` — don't import all apps in one file
- Heavy screens: `const AdminScreen = lazy(() => import('./screens/AdminScreen'))` if bundle size grows

### Memoization
```tsx
const filtered = useMemo(() => items.filter((i) => i.name.includes(q)), [items, q]);
const handlePress = useCallback(() => { ... }, [deps]);
export const ListItem = memo(function ListItem({ item }: Props) { ... });
```

### React Query
- `staleTime` for stable data (settings: 5min)
- `refetchInterval` for dashboards (15–60s) when no socket event
- `enabled: isAuthenticated` to avoid firing before auth
- Narrow `queryKey` arrays for targeted invalidation

### Lists
- Use virtual list (`@tanstack/react-virtual`) when >100 items
- `key={item.id}` on mapped elements — never index keys for mutable lists

### Images
- Prefer Next.js `Image` for external URLs with known dimensions
- Avatar fallbacks: initials in gradient circle (see `ContactAvatar.tsx`)

### Rendering
- Avoid inline object/array literals in props passed to memoized children
- Keep Zustand selectors narrow: `useStore((s) => s.activeTab)` not whole store
- Don't subscribe to Zustand in selectors that create new references each render (causes infinite loops — select raw state, derive outside)

### Reduced motion
```tsx
import { useReducedMotion } from 'framer-motion';
const reduceMotion = useReducedMotion();
<motion.div animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }} />
```

---

## Accessibility

- `aria-label` on icon-only buttons
- `role="button"` + `tabIndex={0}` + `onKeyDown` for custom pressables (see `GlassPanel`)
- Sufficient contrast: white text on dark glass surfaces
- Focus visible on interactive elements
- Status updates via `role="status"` on Dynamic Island

---

## Registration

```typescript
// apps/web/src/services/registerSystemApps.ts
import { MyApp } from '@/apps/myapp';
import { myManifest } from '@/apps/myapp/manifest';
registerApp(myManifest, MyApp);
```

---

## Testing

```typescript
// apps/web/src/apps/<app>/__tests__/<app>.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror controller Zod schemas
// Test bundle ID, permission names, format regex
```

Run: `npx vitest run src/apps/<app>/__tests__/<app>.test.ts`

---

## Verification

```bash
npm run build --workspace=@bananaos/web
npx vitest run src/apps/<app>/__tests__/
```

---

## Anti-Patterns

| Don't | Do |
|-------|-----|
| `fetch()` directly in components | `appService` + `apiRequest` |
| Store API data in Zustand | TanStack Query cache |
| `any` props | Typed interfaces |
| CSS `transition: all` | Framer Motion springs |
| New Button component per app | `@/components/shared/Button` |
| Placeholder "Lorem ipsum" UI | `EmptyState` with real copy |
| `getSnapshot` returning new objects | Select stable store slices |
