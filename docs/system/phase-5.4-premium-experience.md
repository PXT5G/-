# GULFOS Phase 5.4 — Premium Experience Platform

Phase 5.4 extends personalization, device ecosystem continuity, and performance monitoring on top of Phase 5.1 premium experience and Phase 5.3 intelligence.

## Backend

### Constants

`apps/api/src/constants/personalization.ts` — theme modes, wallpaper types, device types, socket events.

### Models (`apps/api/src/database/models/Personalization.ts`)

| Model | Purpose |
|-------|---------|
| `ThemeProfile` | User theme configuration |
| `WallpaperPack` | Wallpaper collections |
| `HomeLayout` | Home screen page/dock layout |
| `LockScreenProfile` | Lock screen customization |
| `ContinuitySession` | Handoff sessions |
| `ClipboardSession` | Cross-device clipboard sync |

### Service

`apps/api/src/services/personalizationService.ts` — initialization, themes, wallpapers, layouts, lock screen, handoff, clipboard, performance snapshot.

### API Routes (`/api/personalization/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/initialize` | Seed default profiles |
| GET | `/themes` | List theme profiles |
| POST | `/themes/:id/activate` | Activate theme |
| GET | `/wallpapers` | List wallpaper packs |
| GET | `/layouts` | List home layouts |
| PATCH | `/layouts/:id` | Update home layout |
| GET | `/lock-screen` | List lock screen profiles |
| POST | `/lock-screen/:id/activate` | Activate lock screen profile |
| POST | `/handoff` | Start continuity handoff |
| POST | `/clipboard` | Sync clipboard |
| GET | `/clipboard` | Get latest clipboard |
| GET | `/performance` | Performance snapshot |

### Socket Events

`theme:update`, `layout:update`, `wallpaper:update`, `handoff:start`, `clipboard:update`, `performance:update`

### Background Jobs

- `continuity-cleanup` — expire handoff/clipboard sessions

## Frontend

| App | Bundle ID | Route |
|-----|-----------|-------|
| Personalization | `com.gulfos.personalization` | `/personalization` |
| Performance | `com.gulfos.performance` | `/performance` |

Hooks: `usePersonalization.ts` — init, socket sync, themes, wallpapers, layouts, lock screen, performance.

## Integration

- Mounted in `apps/api/src/index.ts`
- Registered in `registerSystemApps.ts` and `RUNTIME_APPS`
- Initialized on system boot via `systemController.initializeSystemServices`
