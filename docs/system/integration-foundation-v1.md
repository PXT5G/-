# Integration Foundation V1

Generic infrastructure for future external integrations (V2 Discord and beyond). **No Discord-specific code** in this phase.

## Components

### Service-to-Service Authentication

| Item | Path |
|------|------|
| Constants | `apps/api/src/constants/serviceAuth.ts` |
| Service | `apps/api/src/services/serviceAuthService.ts` |
| Middleware | `apps/api/src/api/middleware/serviceAuth.ts` |

**Headers:** `X-Service-Token` or `Authorization: Bearer <token>`

**Token rotation:** `SERVICE_AUTH_TOKEN` + optional `SERVICE_AUTH_TOKEN_PREVIOUS`

### Health Check

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | Public | Full system health report |
| `GET /api/internal/health` | Public | Same report (internal mount) |
| `POST /api/internal/heartbeat` | Service Token | External service heartbeat |
| `GET /api/internal/services` | Service Token | List registered service heartbeats |

Service: `apps/api/src/services/healthService.ts`

### Idempotency

| Item | Path |
|------|------|
| Model | `IdempotencyRecord` |
| Service | `idempotencyService.ts` |
| Middleware | `idempotencyMiddleware` (global, opt-in via header) |

**Header:** `Idempotency-Key` (8–128 chars) on POST/PUT/PATCH/DELETE

TTL: 24 hours. Background cleanup: `idempotency-cleanup`

### Notification Providers

| Item | Path |
|------|------|
| Interface | `constants/notificationProviders.ts` |
| Registry | `notificationProviderRegistry.ts` |
| Defaults | `notificationProviders/defaultProviders.ts` (socket, event_bus) |

`notificationBrokerService.deliverNotification` dispatches through registered providers.

Future V2 Discord provider registers via `registerNotificationProvider()` without broker changes.

### Token Encryption

Service: `tokenEncryptionService.ts` — AES-256-GCM for secrets at rest.

**Env:** `TOKEN_ENCRYPTION_KEY` (min 32 chars, optional until needed)

## Environment Variables

```env
SERVICE_AUTH_TOKEN=
SERVICE_AUTH_TOKEN_PREVIOUS=
TOKEN_ENCRYPTION_KEY=
```

## V2 Readiness

V2 Discord integration will use:

- `authenticateService` on `/api/internal/*` (or future `/api/integrations/*/internal/*`)
- `registerNotificationProvider` for Discord delivery
- `encryptSecret` for OAuth refresh tokens
- `Idempotency-Key` on link/sync operations
- `POST /api/internal/heartbeat` for bot health

No architectural changes required.
