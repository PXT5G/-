# GULFOS Premium Experience — Phase 5.1

Phase 5.1 extends the Phone OS Core (Phase 5.0) with a flagship premium smartphone experience layer. All changes extend existing architecture without rewrites.

## Overview

The premium experience layer provides:

- **Lock Screen 2.0** — layouts, clock customization, widgets, shortcuts, charging animation
- **Home Screen** — unlimited pages, hidden apps/pages, widget engine, App Library
- **Widget Engine** — 24 production widget types with realtime data
- **Notification Center Pro** — grouping, priority, pinned, history
- **Control Center Pro** — paginated controls, system metrics
- **Multitasking Pro** — cards, grid, horizontal modes
- **Dynamic Island Pro** — multi-activity stack
- **Premium Settings** — full personalization hub

## Backend

### Constants

`apps/api/src/constants/premiumExperience.ts`

Lock layouts, clock fonts/colors, wallpaper collections, multitasking modes, control center pages, widget types, notification strategies, dynamic island types.

### Models

| Model | Purpose |
|-------|---------|
| `PremiumExperienceProfile` | User premium configuration |
| `WidgetRegistryEntry` | Server-side widget registry |
| `NotificationHistoryEntry` | Persistent notification history |

### Services

| Service | Purpose |
|---------|---------|
| `widgetEngineService` | Widget registry seeding and per-type data |
| `premiumExperienceService` | Profile CRUD, app library, quick notes, notification history |

### API Routes

Mounted at `/api/device/premium/*`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/initialize` | Initialize premium experience |
| GET/PATCH | `/profile` | Get/update profile |
| POST | `/track-app` | Track app usage |
| POST | `/quick-notes` | Add quick note |
| GET | `/app-library` | Categorized app library |
| GET | `/notifications/history` | Notification history |
| POST | `/notifications/:id/pin` | Pin notification |
| GET | `/widgets/registry` | Widget registry |
| GET | `/widgets/:type/data` | Widget data by type |
| POST | `/widgets/batch` | Batch widget data |

### Socket Events

- `premium:ready` — initialization complete
- `premium:update` — profile updated
- `notification:history` — history changed
- `widget:data:update` — widget data refreshed

### Global Search Extensions

Added searchers for files, photos, browser history, downloads, and contacts.

## Frontend

### Stores & Hooks

- `premiumExperienceStore` — profile, app library, notification history
- `usePremiumExperienceInit` — hydrate profile and widget registry
- `usePremiumExperienceRealtime` — socket sync
- `useWidgetData(type)` — per-widget realtime data
- `useAppLibrary()` — categorized app library
- `useNotificationHistory()` — notification history

### Components

| Component | Upgrade |
|-----------|---------|
| `LockScreen` | Profile-driven layout, clock, widgets, shortcuts |
| `HomeScreen` | Hidden pages/apps, App Library gesture |
| `WidgetRenderer` | Production widget engine |
| `WidgetContent` | Per-type widget rendering |
| `AppLibrary` | Categories, recent, suggestions |
| `Dock` | Profile-driven dock apps |
| `NotificationCenter` | Grouping, history tab, pinned |
| `ControlCenter` | Paginated pages, metrics |
| `MultitaskingView` | Grid/horizontal modes |
| `DynamicIsland` | Multi-activity stack |
| `PremiumPhoneSettingsScreen` | Full personalization hub |

### Integration

`OSProvider` initializes premium experience on boot alongside Phone OS Core. App launches track usage via `premiumExperienceService.trackAppUsage()`.

## Widget Types

Weather, Calendar, Battery, Stocks, Clock, Music, Maps, Bank, Business, EMS, Police, Justice, Exchange, Real Estate, Vehicles, Marine, Aviation, Chat, Notes, Poetry, Files, Photos, Camera, Browser.

Each supports small/medium/large sizes with interactive and realtime data from backend services.

## Tests

```bash
npm test -- apps/api/src/services/__tests__/premiumExperience.test.ts
```

## Architecture Notes

- Extends Phase 5.0 Phone OS Core — does not replace it
- Widget data fetched via TanStack Query with 60s refresh
- Profile changes emit `premium:update` for realtime sync
- Premium settings accessible via Settings → Premium Experience
