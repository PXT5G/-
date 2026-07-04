# BananaOS Phone App

**App ID:** `com.bananaos.phone`  
**Category:** Communication  
**API Base:** `/api/phone`

Production-ready dialer for BananaOS with realtime call lifecycle, voicemail, favorites, emergency calling, and full platform integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Phone App (React)                                          │
│  screens • store • realtime hooks • Dynamic Island          │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + Socket.io
┌──────────────────────────▼──────────────────────────────────┐
│  phoneController → phoneService / callService                 │
│                  voicemailService / emergencyService          │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
 Identity + SIM      Contacts lookup      Platform Services
 (gate + number)     (search/favorites)   (RBAC, audit, events)
```

### Services

| Service | Responsibility |
|---------|----------------|
| `phoneService` | Init, dashboard, settings, favorites, blocked numbers, contact search, audit |
| `callService` | Make/end/accept/reject, hold/resume, mute/speaker, conference, recording |
| `voicemailService` | Visual voicemail inbox, greetings, read/delete |
| `emergencyService` | Emergency contacts, 911 calls, contact sync |

---

## Database

Phone-scoped MongoDB collections (distinct from SIM settings models):

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
| `PhonePermission` | `phonepermissions` | Legacy RBAC |
| `PhoneAuditLog` | `phoneauditlogs` | App audit trail |

All models include `createdAt`, `updatedAt`, `createdBy`, `updatedBy` where applicable.

---

## API

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

## Permissions

Phone uses the centralized Permission Engine (`permissionEngineService`) with `PhonePermission` legacy dual-write.

**Default user permissions:** `view_dashboard`, `make_call`, `receive_call`, `end_call`, `manage_favorites`, `view_recents`, `view_voicemail`, `manage_voicemail`, `block_numbers`, `emergency_call`, `manage_settings`

**Admin additions:** `conference_call`, `record_call`, `view_audit_logs`

Every controller action calls `checkPerm` before mutations.

---

## Realtime

Socket.io events via `eventBusService.emitToUser`:

| Event | When |
|-------|------|
| `phone:ringing` | Outbound dial or inbound call |
| `phone:accepted` | Call connected |
| `phone:ended` | Call terminated |
| `phone:missed` | Unanswered incoming |
| `phone:hold` | Call placed on hold |
| `phone:resume` | Call resumed |
| `phone:mute` | Mute toggled |
| `phone:speaker` | Speaker toggled |
| `phone:voicemail` | New voicemail message |
| `phone:notification` | Push notification domain event |

Frontend: `usePhoneRealtime` invalidates React Query and drives Dynamic Island live call UI.

---

## Audit

Every call action creates:

1. **CoreAuditLog** via `auditService.log()`
2. **PhoneAuditLog** app-specific record

Actions audited: `call_initiated`, `call_accepted`, `call_ended`, `call_hold`, `favorite_added`, `number_blocked`, `emergency_call_initiated`, `voicemail_received`, etc.

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
6. **Active Call** → mute, hold, speaker, timer, waveform
7. **Recents/Favorites/Contacts** → tap to call back
8. **Voicemail** → visual inbox with read/delete
9. **Emergency** → one-tap 911 or emergency contact call

---

## Frontend

Location: `apps/web/src/apps/phone/`

| Screen | Features |
|--------|----------|
| Dashboard | Number, missed badge, shortcuts, emergency |
| Dial Pad | Haptic keys, animated display |
| Incoming Call | Swipe answer/reject, large avatar |
| Active Call | Timer, waveform, mute/hold/speaker |
| Recent Calls | Filter incoming/outgoing/missed |
| Favorites | Speed dial |
| Contacts Picker | Search, call, add favorite |
| Voicemail | Unread badges, transcripts |
| Blocked Numbers | Block/unblock |
| Settings | Toggles, forwarding |

UI: Glassmorphism, Framer Motion, Dynamic Island live call indicator.

---

## Testing

```bash
npm run build
npm run test --workspace=@bananaos/web
npm run test --workspace=@bananaos/api
```

- `apps/web/src/apps/phone/__tests__/phone.test.ts` — Zod schemas, permissions, socket events
- `apps/api/src/services/__tests__/phone.test.ts` — API validation, app ID

---

## Future Roadmap

- [ ] WebRTC peer connection for browser-to-browser audio
- [ ] Video calling with camera permission
- [ ] Call transcription via AI pipeline
- [ ] Spam identification integration with SIM spam filter
- [ ] Widget: recent calls on home screen
- [ ] CarPlay / Bluetooth headset routing simulation
- [ ] Group conference with 3+ live participants
- [ ] Visual voicemail waveform playback
