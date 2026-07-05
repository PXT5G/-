# GULFOS Core Phone Applications — Phase 5.1 Part 2

Production core communication applications extending Phone OS Core and Premium Experience.

## Applications

| App | Bundle ID | API Base |
|-----|-----------|----------|
| Phone | `com.gulfos.phone` | `/api/phone/*` |
| Contacts | `com.gulfos.contacts` | `/api/contacts/*` |
| Messages | `com.gulfos.messages` | `/api/messages/*` |
| Mail | `com.gulfos.mail` | `/api/mail/*` |
| SIM | `com.gulfos.sim` | `/api/sim/*` |

## Call Engine

`callEngineService.ts` manages the full call lifecycle:

- Initiate, answer, end calls
- Hold, mute, audio routing
- Incoming call simulation with Live Activities + notifications
- Conference support metadata
- Call history, statistics, export
- Stale call cleanup (background job)

### Socket Events

- `phone:incoming` — incoming call ring
- `phone:connected` — call answered
- `phone:ended` — call terminated
- `phone:status` — mute/hold/route updates
- `phone:voicemail` — new voicemail

## Contacts

Full contact management with categories: personal, business, government, police, EMS, justice, emergency.

- Multiple phones, emails, addresses
- Favorites, groups, tags
- Duplicate detection and merge
- Government directory seeded on init

## Messages (SMS)

Routes all SMS through Communication Core (`messageType: 'sms'`, `senderAppId: com.gulfos.messages`).

- Conversations, send, search
- Typing indicators
- Realtime via `messages:new`, `messages:typing`

## Mail

Standalone mail client with accounts, folders, send/receive, search.

- Folders: inbox, sent, drafts, trash, spam, archive
- Priority inbox support
- Push notifications via Notification Broker

## SIM Manager

Dual SIM support with carrier info, signal strength, roaming, preferred SIM per service type.

- Background `sim-status-refresh` job (30s)
- Realtime `sim:status`, `sim:updated`

## Integration

- **Notification Broker** — incoming calls, mail, messages
- **Live Activities** — incoming calls on Dynamic Island + Lock Screen
- **Global Search** — contacts and calls searchers
- **Widget Engine** — phone, contacts, messages, mail widgets
- **Permission Broker** — per-app permissions granted on system init

## Frontend

Each app includes manifest, service, hooks, and production UI:

- `apps/web/src/apps/phone/` — Favorites, Recents, Contacts, Keypad, Voicemail
- `apps/web/src/apps/contacts/` — Search, categories, add contact
- `apps/web/src/apps/messages/` — Conversation list, SMS thread
- `apps/web/src/apps/mail/` — Folder navigation, message list
- `apps/web/src/apps/sim/` — Dual SIM management

`OSProvider` wires `usePhoneRealtime()` for incoming call UI.

## Tests

```bash
cd apps/api && npm test -- src/services/__tests__/corePhoneApps.test.ts
```

## Architecture

Extends Phase 5.0 Phone OS Core and Phase 5.1 Premium Experience. Does not replace Communication Core — Messages app delegates to it for all SMS operations.
