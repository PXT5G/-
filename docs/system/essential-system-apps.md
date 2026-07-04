# BananaOS Essential System Applications

Phase 3.6 delivers 10 production-ready core system apps that every smartphone ships with. All apps integrate with Identity, Bank, SIM, Phone, Contacts, Communication Core, World Engine, Device Ecosystem, Notification Broker, and Permission Broker.

## Applications

| App | Bundle ID | Backend | Key Features |
|-----|-----------|---------|--------------|
| Banana Maps | `com.bananaos.maps` | `/api/system-apps/maps/*` + World Engine | GTA map, GPS, navigation, favorites, offline cache, traffic, police roadblocks |
| Camera | `com.bananaos.camera` | `/api/system-apps/camera/*` | Photo, portrait, video, slow-mo, time lapse, night mode, flash, HDR, grid, zoom, burst, RAW |
| Gallery | `com.bananaos.gallery` | `/api/system-apps/gallery/*` | Albums, favorites, hidden, trash, AI categories, memory timeline, storage analysis |
| Files | `com.bananaos.files` | `/api/system-apps/files/*` + `/api/filesystem` | Browse, recent, categories, search, PDF/ZIP preview |
| Calendar | `com.bananaos.calendar` | `/api/system-apps/calendar/*` | Events, reminders, birthdays, government, police shifts, justice hearings, bank payments |
| Clock | `com.bananaos.clock` | `/api/system-apps/clock/*` | Alarms, stopwatch, timer, world clocks, sleep schedule |
| Calculator | `com.bananaos.calculator` | Client-only | Basic, scientific, history, currency/unit conversion |
| Notes | `com.bananaos.notes` | `/api/system-apps/notes` | Rich text, pin, lock, search, folders |
| Voice Recorder | `com.bananaos.voicerecorder` | `/api/system-apps/voice-recorder` | Recording, noise reduction, bookmarks, trim |
| Weather | `com.bananaos.weather` | `/api/system-apps/weather` | Current, hourly, weekly, rain, wind, visibility (World Engine) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    System Apps Orchestrator                      │
│              systemAppsService.initialize()                      │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
    camera     gallery    calendar     maps     weather
    service    service    service    service    service
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
  mediaStorage  GalleryItem CalendarEvent MapsCache  WorldState
```

## API

All endpoints mount at `/api/system-apps/*` with JWT authentication.

### Initialize

```
POST /api/system-apps/initialize
```

Called on boot via `initializeSystemServices()` and frontend `useSystemAppsInit()`.

## Integrations

- **World Engine**: Maps (GPS, navigation, districts), Weather (live conditions)
- **Media Storage**: Camera captures → Gallery items + storage accounting
- **Permission Broker**: Camera, microphone, location, storage permissions
- **Notification Broker**: Calendar reminders, clock alarms
- **Audit Service**: All mutations logged via `systemAppsAuditService`
- **Device Ecosystem**: Storage tracking, battery/RAM via hardware profiles

## Frontend

- **Service**: `apps/web/src/services/systemAppsService.ts`
- **Hooks**: `apps/web/src/hooks/useSystemApps.ts`
- **Apps**: `apps/web/src/apps/{maps,camera,gallery,files,calendar,clock,calculator,notes,voice-recorder,weather}/`
- **Registration**: `registerSystemApps.ts` — all 10 apps registered at boot
- **Widgets**: Weather widget wired to live World Engine data

## Models

| Model | Purpose |
|-------|---------|
| `GalleryItem` | Photo/video metadata with AI categories |
| `GalleryAlbum` | Album organization |
| `CalendarEvent` | Events with government/police/bank types |
| `ClockAlarm` | Alarms with sleep schedule |
| `Note` | Rich notes with checklists |
| `VoiceRecording` | Audio recordings with bookmarks |
| `MapsOfflineCache` | Offline map tile cache |

## Socket Events

| Event | Description |
|-------|-------------|
| `system-apps:ready` | All system apps initialized |
| `gallery:update` | Gallery items changed |
| `camera:capture` | Photo/video captured |
| `calendar:update` | Calendar events changed |
| `clock:update` | Alarms changed |
| `notes:update` | Notes changed |
| `voice-recorder:update` | Recordings changed |
| `weather:update` | Weather data refreshed |
| `maps:update` | Navigation/offline maps changed |
| `files:update` | Files changed |

## Testing

```bash
npm test --workspace=apps/api -- systemApps
```

## Store

All 10 apps are seeded in `storeSeedService.ts` with `isSystemApp: true` and registered in `RUNTIME_APPS`.
