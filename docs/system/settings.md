# GULFOS System Settings

Phase 3.7 transforms Settings into a fully functional operating-system control center. Every option persists in MongoDB, syncs in realtime via Socket.io, logs audit events, and immediately affects the OS through the settings broker pipeline.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Settings Control Center                      │
│              SettingsApp → useSettings → settingsService         │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   Zustand    TanStack    Socket.io   i18n      Side Effects
   settings   Query       realtime    store     (theme/sound/network/power)
   store                  sync
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   MongoDB    REST API    settings:   RTL/LTR   DeviceState
   UserSettings /api/settings updated  t()      NetworkState
                                        DeviceProfile
```

### Design principles

- **Server-authoritative**: Client optimistically updates, API validates with Zod, MongoDB persists
- **Instant OS effects**: `applySettingsToOS()` syncs theme, sound, haptic, RTL, font, and accessibility classes
- **No placeholders**: Every toggle and slider calls `PATCH /api/settings` with validated fields
- **Extend only**: Builds on Phase 3.5 device ecosystem and Phase 3.6 system apps

## Device Information

| Field | Value |
|-------|-------|
| Default Device Name | Gulf Phone V1 |
| Developer | Abu Sharaf |
| Manufacturer | Gulf Technologies |
| Operating System | GULFOS |
| Kernel | GULF Core |
| Hardware Version | 1.0 |
| Build Number | 3.7.0 |

Device UUID and serial number are auto-generated on first hardware profile seed.

## Database

### UserSettings collection

Extended `UserSettings` model stores all OS preferences:

- **General**: language, region, timezone, dateFormat, timeFormat, temperatureUnit, distanceUnit, currency, keyboardLayout
- **Display**: theme, accentColor, wallpaper, autoTheme, fontSize, displayZoom, animations, brightness, autoBrightness, refreshRate, screenTimeout, alwaysOnDisplay
- **Sound**: mediaVolume, callVolume, notificationVolume, alarmVolume, soundsEnabled, vibrationEnabled, ringtone, notificationSound, keyboardSound, hapticsEnabled
- **Network**: wifiEnabled, mobileDataEnabled, bluetoothEnabled, airplaneMode, hotspotEnabled
- **Accessibility**: voiceOverEnabled, largeText, boldText, reduceMotion, highContrast, colorFilters, monoAudio, touchAssistance
- **Security**: twoFactorEnabled, appLockEnabled, developerModeEnabled
- **Power**: powerSavingMode, lowPowerMode, silentMode

Defaults are defined in `apps/api/src/constants/settings.ts` as `DEFAULT_USER_SETTINGS`.

## API

All endpoints mount at `/api/settings/*` with authentication required.

```
GET   /api/settings              — Get user settings (creates defaults if missing)
PATCH /api/settings              — Update settings (Zod validated)
POST  /api/settings/reset        — Reset to defaults
GET   /api/settings/languages    — List supported languages
GET   /api/settings/about        — Device about information
GET   /api/settings/translations/:code — Translation dictionary for language
```

### Example PATCH

```json
{
  "language": "ar",
  "theme": "dark",
  "brightness": 75,
  "refreshRate": 120,
  "powerSavingMode": true
}
```

## Localization

### Supported languages (15)

Arabic, English, French, German, Spanish, Italian, Portuguese, Turkish, Russian, Japanese, Chinese, Korean, Hindi, Urdu, Persian

### Implementation

- Translation files: `packages/shared/src/i18n/locales/`
- Runtime API: `getTranslations(code)`, `t(dict, key)`, `isRTL(code)`, `plural(count, forms)`
- Frontend store: `useI18nStore` with instant language switching (no page reload)
- Document attributes: `lang` and `dir` updated on language change
- RTL languages: `ar`, `ur`, `fa`

### Pluralization

```typescript
import { plural } from '@gulfos/shared';
plural(5, { one: '1 minute', other: '{count} minutes' });
```

## Permissions

Settings mutations require authenticated session. RBAC actor ID is captured via `getActorId(req)` for audit logging. Network and power side effects route through existing permission-aware services (`networkService`, `powerSystemService`).

## Audit Logs

Every settings update and reset logs to the global audit service:

| Action | Resource | Metadata |
|--------|----------|----------|
| `settings_update` | `settings` | `{ fields: [...] }` |
| `settings_reset` | `settings` | — |

Maintenance action `reset_settings` delegates to `resetUserSettings()` for full reset with socket emit.

## Realtime

Socket event `settings:updated` broadcasts the full formatted settings payload to all connected clients for the user. Frontend `useRealtime` calls `updateFromServer()` which hydrates Zustand and applies OS effects.

## User Flow

1. User authenticates → `useSettingsInit()` fetches settings from API
2. Settings hydrate `settingsStore`, `themeStore`, `soundStore`, `hapticStore`, `i18nStore`
3. User opens Settings app → navigates sections (General, Language, Display, Sound, etc.)
4. User changes a toggle → optimistic local update + `PATCH /api/settings`
5. API validates, persists, applies side effects, logs audit, emits socket
6. Other tabs/devices receive `settings:updated` and sync instantly

## Side Effects

`applySettingsSideEffects()` in `settingsService.ts`:

| Setting change | System affected |
|----------------|-----------------|
| brightness, alwaysOnDisplay, screenTimeout | `DeviceState` |
| wifi, bluetooth, airplane, hotspot, mobile data | `NetworkState` via `networkService` |
| powerSavingMode, lowPowerMode | `powerSystemService` |
| language, region, timezone | `DeviceProfile` via `deviceProfileService` |
| silentMode | `DeviceState` |

## Developer Guide

### Adding a new setting

1. Add field to `DEFAULT_USER_SETTINGS` in `apps/api/src/constants/settings.ts`
2. Extend `UserSettings` interface in `packages/shared/src/types/index.ts`
3. Add Mongoose field in `apps/api/src/database/models/UserSettings.ts`
4. Add to `settingsUpdateSchema` and `formatSettings()` in `settingsService.ts`
5. Add side effect in `applySettingsSideEffects()` if it affects other systems
6. Extend `DEFAULT_SETTINGS` in `apps/web/src/constants/defaultSettings.ts`
7. Add UI control in appropriate settings screen
8. Add translation keys to `packages/shared/src/i18n/locales/en.ts` and locale overrides

### Frontend hooks

```typescript
import { useSettings, useUpdateSettings, useSettingsInit } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';

// In OSProvider (already wired):
useSettingsInit();

// In a settings screen:
const settings = useSettings();
const update = useUpdateSettings();
const { t } = useTranslation();
update.mutate({ brightness: 90 });
```

### Running tests

```bash
npm test --workspace=@gulfos/api
npm run build
```
