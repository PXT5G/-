# GULFOS — Navigation

> Phase 2 Design Document  
> Defines navigation architecture, routing, and transition patterns.

---

## 1. Navigation Layers

GULFOS uses a **layered navigation model** with four distinct levels:

```
Layer 0: OS Shell (always present)
    ├── Status Bar
    ├── Dynamic Island
    └── Home Indicator

Layer 1: System Overlays (modal, dismissible)
    ├── Control Center
    ├── Notification Center
    ├── Search
    └── Permission Dialog

Layer 2: App Windows (stacked, z-index managed)
    ├── App Window Chrome
    └── App Content (per-app navigation)

Layer 3: App Internal Navigation (per-app)
    ├── Tab bars
    ├── Stack navigation
    └── Modal sheets
```

---

## 2. OS-Level Navigation

### 2.1 Phase Management (`osStore.phase`)

Primary OS state drives which shell screens are visible:

| Phase | Visible Screens | Hidden |
|-------|----------------|--------|
| `splash` | SplashScreen | All others |
| `booting` | BootAnimation | All others |
| `locked` | LockScreen + StatusBar + Island | Home, apps |
| `home` | HomeScreen + Dock + StatusBar + Island | Lock, apps |
| `app` | AppWindow + StatusBar + Island | Home (behind) |

### 2.2 Overlay Stack

Overlays render above the current phase without changing it:

```
z-index stack (bottom → top):
  0   — Wallpaper
  30  — Dock
  35  — App Windows
  40  — Lock Screen
  45  — Control Center / Notification Center backdrop
  46  — Control Center / Notification Center panel
  50  — Search
  55  — Dynamic Island
  60  — Permission Dialog
  70  — Toast / Alert (Phase 2)
```

### 2.3 Gesture Map

| Gesture | Target Area | Action | Phase |
|---------|-------------|--------|-------|
| Swipe up | Lock screen | Unlock | `locked` |
| Swipe up | App window (from top) | Minimize app | `app` |
| Swipe up + hold | Home screen | Multitasking (Phase 2) | `home` |
| Swipe down | Top-right 30% | Control Center | `home`, `app` |
| Swipe down | Top-left 30% | Notification Center (Phase 2) | `home`, `app` |
| Swipe left/right | Home screen | Change page | `home` |
| Long press | App icon | Jiggle mode (Phase 2) | `home` |
| Long press | Empty area | Search | `home` |
| Tap | Dynamic Island | Expand/collapse | any |
| Tap | Home indicator | Return home | `app` |

---

## 3. App Routing System

### 3.1 Registry (`appRouter.ts`)

Apps register at boot via `registerSystemApps.ts`:

```typescript
registerApp(manifest: AppManifest, component: AppComponent);
```

| Field | Purpose |
|-------|---------|
| `bundleId` | Unique identifier (e.g., `com.gulfos.phone`) |
| `route` | Deep link path (e.g., `/phone`) |
| `entryPoint` | Component export name |
| `permissions` | Required permission types |
| `isSystemApp` | Cannot be uninstalled |

### 3.2 Launch Mechanism

```
Trigger (icon tap, dock, search, notification action, deep link)
    │
    ▼
windowManagerStore.openWindow({ appId, title, ... })
    │
    ▼
AppWindow renders:
    APP_COMPONENTS[appId] ?? AppPlaceholder
```

### 3.3 Deep Linking (Phase 2)

```
URL: gulfos://phone/dial?number=+1234567890
    │
    ▼
Parse URL → bundleId + path + params
    │
    ▼
openWindow({ appId: 'com.gulfos.phone', ... })
    │
    ▼
App receives initialRoute + params via context
```

### 3.4 App Bundle IDs

| App | Bundle ID |
|-----|-----------|
| Identity | `com.gulfos.identity` |
| SIM Card | `com.gulfos.sim` |
| Phone | `com.gulfos.phone` |
| Messages | `com.gulfos.messages` |
| Contacts | `com.gulfos.contacts` |
| Bank | `com.gulfos.bank` |
| Police | `com.gulfos.police` |
| EMS | `com.gulfos.ems` |
| Community | `com.gulfos.community` |
| Announcements | `com.gulfos.announcements` |
| Store | `com.gulfos.store` |
| Settings | `com.gulfos.settings` |
| Files | `com.gulfos.files` |
| Gallery | `com.gulfos.gallery` |
| Camera | `com.gulfos.camera` |
| Browser | `com.gulfos.browser` |
| Music | `com.gulfos.music` |
| Calendar | `com.gulfos.calendar` |
| Calculator | `com.gulfos.calculator` |
| Clock | `com.gulfos.clock` |
| Weather | `com.gulfos.weather` |
| Downloads | `com.gulfos.downloads` |
| Profile | `com.gulfos.profile` |

---

## 4. Per-App Navigation Patterns

### 4.1 Tab Bar Navigation
**Used by:** Phone, Messages, Contacts, Bank, Police, Community, Files, Gallery, Music, Calendar, Clock

```
┌─────────────────────────────┐
│         Content             │
│                             │
├─────────────────────────────┤
│  Tab1  │  Tab2  │  Tab3    │
└─────────────────────────────┘
```

- Tabs fixed at bottom (above home indicator)
- Active tab: gold underline + bold label
- Badge counts on tabs (e.g., Messages unread)

### 4.2 Stack Navigation
**Used by:** Settings, Identity, SIM Card, Profile, Store, Announcements

```
Screen A → push → Screen B → push → Screen C
                ← pop ←        ← pop ←
```

- Back button in app chrome (top-left)
- Stack managed per-app via `useAppNavigation` hook (Phase 2)

### 4.3 Modal Sheets
**Used by:** Share sheets, pickers, confirmations, compose screens

```
Parent Screen
    │ action trigger
    ▼
[Sheet slides up from bottom — 50% or 90% height]
    │ dismiss (swipe down or tap outside)
    ▼
Parent Screen
```

### 4.4 Full-Screen Takeover
**Used by:** Camera, incoming call, Browser, Calculator

- Hides standard app chrome
- Custom top/bottom bars
- Exit via explicit close or gesture

---

## 5. App Internal Navigation Contract

Every Phase 2 app must implement:

```typescript
// apps/web/src/apps/<name>/navigation.ts

export interface AppNavigationState {
  currentScreen: string;
  params?: Record<string, unknown>;
  history: string[];
}

export interface AppNavigationActions {
  push(screen: string, params?: Record<string, unknown>): void;
  pop(): void;
  replace(screen: string, params?: Record<string, unknown>): void;
  reset(): void;
}
```

### Standard Screens per App Category

| Category | Standard Screens |
|----------|-----------------|
| Communication | List → Detail → Compose |
| Media | Grid → Viewer → Editor |
| Utility | Main → Settings |
| Finance | Dashboard → Detail → Action → Confirm |
| Government | Dashboard → Application → Status |
| System | List → Detail → Toggle |

---

## 6. Transition Animations

### 6.1 OS Transitions

| Transition | Animation | Duration |
|------------|-----------|----------|
| App open | Slide up from bottom | spring 300/35 |
| App close | Slide down to bottom | 300ms ease-in |
| App minimize | Scale down to dock icon | 400ms spring |
| Overlay open | Fade backdrop + slide panel | spring 300/35 |
| Overlay close | Reverse | 250ms |
| Tab switch | Crossfade content | 200ms |
| Stack push | Slide from right | 300ms ease-out |
| Stack pop | Slide to right | 300ms ease-in |
| Sheet open | Slide from bottom | spring 400/30 |
| Sheet close | Slide to bottom | 250ms |

### 6.2 Reduced Motion

When `settingsStore.reduceMotion` is true:
- All transitions → opacity fade only (150ms)
- No scale, slide, or spring animations
- Island morphs instantly

---

## 7. Back Navigation Hierarchy

```
Priority (first match wins):

1. Close active overlay (Control Center, Search, etc.)
2. Pop app internal stack
3. Close modal sheet
4. Minimize app window → Home
5. Exit jiggle/edit mode
6. Collapse Dynamic Island
```

### Hardware Back (Android/PWA)
- `popstate` event → triggers back navigation hierarchy
- Phase 2: register per-screen back handlers

---

## 8. Dock Navigation

### Default Dock Layout
| Position | App | Bundle ID |
|----------|-----|-----------|
| 1 | Phone | `com.gulfos.phone` |
| 2 | Messages | `com.gulfos.messages` |
| 3 | Browser | `com.gulfos.browser` |
| 4 | Settings | `com.gulfos.settings` |

### Dock Rules
- Max 4 apps
- Always visible on home screen
- Tapping active app → scroll to top (Phase 2)
- Long press → dock editor (Phase 2)

---

## 9. Search Navigation

Search results route to destinations:

| Result Type | Action |
|-------------|--------|
| `app` | `openWindow(appId)` |
| `contact` | `openWindow('contacts', { id })` |
| `message` | `openWindow('messages', { conversationId })` |
| `file` | `openWindow('files', { path })` |
| `setting` | `openWindow('settings', { section })` |
| `web` | `openWindow('browser', { url })` |

---

## 10. Notification → App Navigation

```
Notification tap
    │
    ▼
markAsRead(notification.id)
    │
    ▼
Parse notification.appId + action
    │
    ├── appId known → openWindow(appId, params)
    └── action URL → deep link router
```

---

## 11. Folder Structure for App Navigation

```
apps/web/src/apps/<app-name>/
├── index.tsx              # Root component (receives navigation state)
├── navigation.ts          # Screen definitions + routes
├── screens/
│   ├── HomeScreen.tsx
│   ├── DetailScreen.tsx
│   └── ...
├── components/            # App-specific components
├── hooks/
│   └── useAppNavigation.ts
├── stores/
│   └── <app>Store.ts
└── manifest.ts            # AppManifest definition
```

---

## 12. Implementation Order

Navigation infrastructure before apps:

1. `useAppNavigation` hook (stack + tabs)
2. `AppTabBar` component
3. `AppSheet` modal component
4. `AppStack` screen wrapper
5. Deep link parser
6. Back navigation handler
7. Per-app integration (one app at a time)
