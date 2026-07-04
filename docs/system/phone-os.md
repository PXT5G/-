# GULF Phone OS Core — Phase 5.0

Production mobile operating system framework extending GULFOS device ecosystem, system UI, and core services.

## Overview

Phase 5.0 transforms GULFOS into a premium smartphone OS experience by extending (not rewriting) existing infrastructure:

- **Device framework**: boot, power, battery, performance, thermals, background apps
- **Device profile**: IMEI, secure device ID, SIM, carrier, MAC addresses, kernel version
- **System UI**: live status bar, upgraded control center, lock screen config, multitasking
- **Global search**: apps, messages, businesses, properties, vehicles, stocks, EMS, police, justice
- **Live Activities**: Dynamic Island integration with realtime cards
- **Permissions**: extended permission types (videos, SMS, clipboard, health, etc.)

## API Endpoints

### `/api/device/phone/*`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/initialize` | Initialize Phone OS state and configs |
| GET | `/info` | Full device info snapshot |
| POST | `/power` | Power on/off/restart/emergency restart |
| POST | `/charging/start` | Start charging (wired/fast/wireless) |
| POST | `/charging/stop` | Stop charging |
| GET | `/battery` | Battery state |
| GET | `/performance` | Performance/thermal state |
| PATCH | `/performance/mode` | Set performance mode |
| GET | `/diagnostics` | Extended device diagnostics |
| GET/PATCH | `/configs/*` | Control center, lock screen, status bar, wallpaper, widgets, notifications, accessibility |
| GET/POST/PATCH | `/live-activities/*` | Live activity CRUD |
| POST | `/background/:bundleId/freeze` | Freeze background app |
| POST | `/background/:bundleId/pin` | Pin/unpin background app |

### `/api/system/search`

Global search across all GULFOS subsystems.

### `/api/settings/phone-os/*`

Settings-integrated config endpoints mirroring device phone configs.

## MongoDB Models

| Model | Purpose |
|-------|---------|
| `BatteryState` | Battery telemetry, charging estimates |
| `PerformanceState` | CPU/GPU, thermals, background apps |
| `PowerState` | Boot phase, power on/off history |
| `ControlCenterConfig` | Tiles, widgets, focus modes |
| `LockScreenConfig` | Clock style, unlock methods, AOD |
| `StatusBarConfig` | Visible icons and indicators |
| `WallpaperConfig` | Motion, parallax, blur layers |
| `WidgetLayout` | Home screen widget grid |
| `NotificationPreferences` | Grouping, previews, per-app settings |
| `AccessibilityConfig` | VoiceOver, reduce motion, captions |
| `LiveActivity` | Live activity cards |

Extended `DeviceProfile` with IMEI, secure device ID, SIM status, carrier, MAC addresses, kernel version.

## Socket Events

- `charging:start` / `charging:stop`
- `device:boot` / `device:shutdown` / `device:restart`
- `device:lock` / `device:unlock`
- `status:update`
- `control:center:update`
- `widget:update`
- `liveactivity:update`
- `performance:update`
- `security:update`

## Background Jobs

- `phone-os-tick` (30s): battery sync, performance refresh
- `live-activity-expiry` (60s): expire stale live activities

## Frontend

- `phoneOsStore` — Zustand store for battery, performance, live activities, configs
- `usePhoneOs` — init, realtime socket sync, global search, charging/performance mutations
- Upgraded: `StatusBar`, `ControlCenter`, `Search`, `MultitaskingView`, `PermissionDialog`
- Wired: notification center swipe, multitasking swipe-up, permission dialog flow
- Settings: `PhoneOsSettingsScreen` under Device section

## Integration

Phone OS initializes automatically during `/api/system/ready` alongside device ecosystem, world engine, and communication core.
