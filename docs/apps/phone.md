# BananaOS Phone App

**App ID:** `com.bananaos.phone`  
**Category:** Communication  
**API Base:** `/api/phone`

Production-ready dialer for BananaOS with realtime call lifecycle, voicemail, favorites, emergency calling, offline resilience, and full platform integration.

---

## Final Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Phone App (React / Next.js)                                     │
│  screens • Zustand store • realtime • offline queue • toasts     │
│  shared GlassCard • PhoneIcons • OfflineBanner • Toggle          │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST + Socket.io
┌──────────────────────────▼───────────────────────────────────────┐
│  phoneController → phoneService / callService                    │
│                  voicemailService / emergencyService             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
 Identity + SIM      Contacts lookup      Platform Services
 (gate + number)     (search/favorites)   (RBAC, audit, events)
```

### Services

| Service | Responsibility |
|---------|----------------|
| `phoneService` | Init, dashboard, settings, favorites, blocked numbers, contact search, audit, `normalizePhone` |
| `callService` | Make/end/accept/reject, hold/resume, mute/speaker, conference, recording |
| `voicemailService` | Visual voicemail inbox, greetings, read/delete |
| `emergencyService` | Emergency contacts, 911 calls, contact sync |

### Frontend Modules

| Path | Purpose |
|------|---------|
| `apps/web/src/apps/phone/` | App shell, screens, store |
| `hooks/usePhoneRealtime.ts` | Socket.io event sync (no polling for active call) |
| `hooks/usePhoneOffline.ts` | Offline queue + auto-retry on reconnect |
| `components/shared/GlassCard.tsx` | Shared design-system glass card (banana-gold accent) |
| `components/shared/OfflineBanner.tsx` | Offline / sync status banner |
| `components/shared/Toast.tsx` | Success/error feedback toasts |

---

## Database

| Model | Collection | Purpose |
|-------|------------|---------|
| `Call` | `phone_calls` | Call session records |
| `CallHistory` | `phone_call_histories` | Completed call log |
| `ActiveCall` | `phone_active_calls` | Live call state |
| `PhoneVoicemail` | `phone_voicemails` | Visual voicemail messages |
| `PhoneFavoriteContact` | `phone_favorite_contacts` | Speed dial |
| `PhoneBlockedNumber` | `phone_blocked_numbers` | User blocks |
| `PhoneEmergencyContact` | `phone_emergency_contacts` | Emergency list |
| `CallRecordingMetadata` | `phone_call_recordings` | Recording metadata |
| `PhoneCallSettings` | `phone_call_settings` | Dialer preferences |
| `PhonePermission` | `phonepermissions` | Legacy RBAC dual-write |
| `PhoneAuditLog` | `phoneauditlogs` | App audit trail |

---

## Final APIs

### Permissions

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/permissions` | — |
| POST | `/permissions/init` | `view_dashboard` |

### Dashboard & Settings

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/dashboard` | `view_dashboard` |
| GET/PATCH | `/settings` | `manage_settings` |
| GET | `/audit/logs` | `view_audit_logs` |

### Calls

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/calls` | `make_call` |
| GET | `/calls/active` | `view_dashboard` |
| GET | `/calls/history` | `view_recents` |
| GET | `/calls/missed` | `view_recents` |
| POST | `/calls/:id/accept` | `receive_call` |
| POST | `/calls/:id/reject` | `receive_call` |
| POST | `/calls/:id/end` | `end_call` |
| POST | `/calls/:id/hold` | `end_call` |
| POST | `/calls/:id/resume` | `end_call` |
| POST | `/calls/:id/mute` | `end_call` |
| POST | `/calls/:id/speaker` | `end_call` |
| POST | `/calls/:id/conference` | `conference_call` |
| POST | `/calls/:id/record` | `record_call` |
| POST | `/calls/:id/voicemail` | `manage_voicemail` |

### Favorites, Blocked, Contacts

| Method | Endpoint | Permission |
|--------|----------|------------|
| CRUD | `/favorites` | `manage_favorites` |
| CRUD | `/blocked` | `block_numbers` |
| GET | `/contacts/search` | `view_dashboard` |

### Voicemail & Emergency

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/voicemail` | `view_voicemail` |
| POST | `/voicemail/greeting` | `manage_voicemail` |
| CRUD | `/emergency` | `emergency_call` |
| POST | `/emergency/call` | `emergency_call` |

---

## Permissions Matrix

Phone uses the centralized Permission Engine (`permissionEngineService`) with `PhonePermission` legacy dual-write.

| Permission | User Default | Admin | Used For |
|------------|:------------:|:-----:|----------|
| `view_dashboard` | ✓ | ✓ | Dashboard, active call, contact search |
| `make_call` | ✓ | ✓ | Outbound calls |
| `receive_call` | ✓ | ✓ | Accept/reject incoming |
| `end_call` | ✓ | ✓ | End, hold, resume, mute, speaker |
| `manage_favorites` | ✓ | ✓ | Favorites CRUD |
| `view_recents` | ✓ | ✓ | Call history |
| `view_voicemail` | ✓ | ✓ | Voicemail inbox |
| `manage_voicemail` | ✓ | ✓ | Delete, greeting, redirect |
| `block_numbers` | ✓ | ✓ | Block/unblock |
| `emergency_call` | ✓ | ✓ | 911 + emergency contacts |
| `manage_settings` | ✓ | ✓ | Dialer settings |
| `conference_call` | — | ✓ | Add conference participant |
| `record_call` | — | ✓ | Call recording |
| `view_audit_logs` | — | ✓ | Audit log viewer |

Every controller mutation calls `checkPerm` or service `requirePermission`.

---

## Socket Events

| Event | When | Client Action |
|-------|------|---------------|
| `phone:ringing` | Outbound dial or inbound call | Navigate to incoming/active |
| `phone:accepted` | Call connected | Sync active call, Dynamic Island |
| `phone:ended` | Call terminated | Clear state, invalidate queries |
| `phone:missed` | Unanswered incoming | Clear incoming state |
| `phone:hold` | Call placed on hold | Sync active call state |
| `phone:resume` | Call resumed | Sync active call state |
| `phone:mute` | Mute toggled | Sync active call state |
| `phone:speaker` | Speaker toggled | Sync active call state |
| `phone:voicemail` | New voicemail message | Invalidate voicemail queries |
| `phone:notification` | Push notification domain event | OS notification |

Frontend: `usePhoneRealtime` drives store + React Query invalidation. Active call screen uses realtime sync instead of polling.

---

## Performance Notes

- **Lazy-loaded screens** via `next/dynamic` with `Suspense` fallbacks
- **No active-call polling** — state synced via Socket.io events + one-time fetch fallback
- **Memoized** `PhoneTabBar` and `ActiveCallScreen` to reduce re-renders
- **`staleTime: Infinity`** on active-call queries when store already has state
- **Shared `GlassCard`** eliminates duplicate component bundles
- **`prefers-reduced-motion`** disables Framer Motion animations and waveform loops

---

## Accessibility Notes

- **Banana Gold** design tokens (`banana-gold`) for all accent UI
- **`aria-label` / `aria-pressed` / `role`** on call controls, tab bar, filters
- **SVG icons** (`PhoneIcons`) replace emoji-only buttons in navigation and call actions
- **Minimum 44×44px** touch targets on all interactive controls
- **`prefers-reduced-motion`** respected via `useReducedMotion` hook
- **Screen reader live regions** for toasts, offline banner, call timer, dial display
- **Shared `Toggle`** component with `role="switch"` for settings

---

## Offline Strategy

1. **`useOnlineStatus`** detects `navigator.onLine` + `online`/`offline` events
2. **`OfflineBanner`** shows offline state and queued action count
3. **Queueable mutations** (non-time-sensitive):
   - `addFavorite`, `removeFavorite`
   - `blockNumber`, `unblockNumber`
   - `updateSettings`
   - `markVoicemailRead`, `deleteVoicemail`
4. **`usePhoneOfflineSync`** replays queue automatically when connection returns
5. **Call actions** (dial, accept, reject, end) are **not queued** — require live connection

---

## Test Coverage

```bash
npm run build
npm run test --workspace=@bananaos/web
npm run test --workspace=@bananaos/api
```

| Test File | Coverage |
|-----------|----------|
| `apps/web/src/apps/phone/__tests__/phone.test.ts` | Zod schemas, permissions, socket events |
| `apps/web/src/apps/phone/__tests__/phone.integration.test.ts` | Offline queue, permission matrix, lifecycle contracts, identity/SIM gates |
| `apps/api/src/services/__tests__/phone.test.ts` | `normalizePhone`, `escapeRegex`, app ID, validation |
| `apps/api/src/services/__tests__/phone.integration.test.ts` | Call lifecycle, RBAC, emergency, identity/SIM gates |

---

## Integrations

| System | Integration |
|--------|-------------|
| **Identity** | Verified identity required before init |
| **Banana SIM** | Active SIM + `PhoneNumber` for caller ID |
| **Contacts** | Search, favorites sync, contact photos |
| **Notifications** | Incoming call + voicemail alerts |
| **Permission Engine** | `BANANAOS_APP_IDS.PHONE` RBAC |
| **Event Bus** | Realtime call events + admin control buffer |
| **Audit Service** | `CoreAuditLog` on every mutation |

---

## User Flow

1. User signs in with verified Identity + active SIM
2. `POST /permissions/init` grants default permissions and creates settings
3. **Dashboard** shows number, missed calls, shortcuts
4. **Dial Pad** → `POST /calls` → ringing → accept/end
5. **Incoming** → swipe answer/reject with realtime `phone:ringing`
6. **Active Call** → mute, hold, speaker, timer, waveform (realtime-synced)
7. **Recents/Favorites/Contacts** → tap to call back
8. **Voicemail** → visual inbox with read/delete + offline queue
9. **Emergency** → one-tap 911 or emergency contact call

---

## Frontend Screens

| Screen | Features |
|--------|----------|
| Dashboard | Number, missed badge, shortcuts, emergency |
| Dial Pad | Haptic keys, animated display, accessible call button |
| Incoming Call | Swipe answer/reject, large avatar |
| Active Call | Timer, waveform, mute/hold/speaker (realtime sync) |
| Recent Calls | Filter incoming/outgoing/missed |
| Favorites | Speed dial with offline remove |
| Contacts Picker | Search, call, add favorite |
| Voicemail | Unread badges, transcripts, offline read/delete |
| Blocked Numbers | Block/unblock with offline queue |
| Settings | Accessible toggles, offline settings sync |

UI: Shared glassmorphism (`GlassCard`), Banana Gold tokens, Framer Motion with reduced-motion support, Dynamic Island live call indicator, toast feedback.
