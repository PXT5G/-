# Phone Presence Validation

Centralized gate ensuring the character still owns a phone **before every phone action** — not only when opening the phone UI.

## Rule

```
Any GULFOS Phone action
  → assertPhoneAccess() / assertPhoneAccessForUser()
    → verifyPhoneAccess()  (single validation implementation)
      → success: continue
      → failure: stop immediately, return PHONE_NOT_AVAILABLE
```

No service may implement its own ownership checks. All paths go through `phonePresenceService`.

## Error Response

| Field | Value |
|-------|-------|
| `error` | `PHONE_NOT_AVAILABLE` |
| `message` | `الهاتف لم يعد معك` |
| HTTP status | `403` |

## What Gets Validated

`verifyPhoneAccess()` checks:

1. Valid character session
2. Active character matches the request
3. Phone item in inventory (attestation)
4. Phone bound to this character
5. Phone not seized, transferred, deleted, or suspended

## Guarded Operations

HTTP middleware (`withPhonePresenceGuard`) protects:

- Phone, contacts, messages, mail, SIM, bank, identity
- Device / phone OS, filesystem, settings, apps, system-apps
- Store, browser, chat, communication, notifications
- Personalization, security, privacy, cloud, find-my, updates
- Assistant, automation, shortcuts, focus, intelligence
- Diagnostics, analytics, developer, enterprise, system

## Socket Events

Client → server events in `PHONE_INTERACTIVE_SOCKET_EVENTS` are validated on the socket pipeline. Failure emits `phone:unavailable` to close the phone UI.

## Phone Lost During Use

When validation fails mid-session:

1. Current operation is rejected
2. Active character sessions are ended
3. `phone:unavailable` socket event is sent
4. User cannot use phone features until inventory is restored and `verifyPhoneAccess()` passes again

Bot notifies GULFOS via:

```
POST /api/internal/character/phone/revoke
{
  "externalCharacterId": "...",
  "reason": "seized" | "transferred" | "deleted" | "suspended" | "unbound",
  "inventorySessionId": "..."
}
```

## Environment

```env
PHONE_PRESENCE_ENFORCE=false   # default — enforce only when character session exists
PHONE_PRESENCE_ENFORCE=true    # production / Discord — always enforce
```

## Usage in Services

```typescript
import { assertPhoneAccessForUser } from '../phonePresenceService';

export async function somePhoneAction(userId: string) {
  const scope = await assertPhoneAccessForUser(userId);
  // scope.phoneId available for data isolation
}
```

HTTP routes are guarded automatically at mount time in `apps/api/src/index.ts`.
