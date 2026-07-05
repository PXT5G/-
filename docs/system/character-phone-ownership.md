# Character-Based Phone Ownership

Platform-agnostic layer for binding virtual phones to **characters** (not Discord users or GULFOS accounts alone). Builds on [Integration Foundation V1](./integration-foundation-v1.md).

## Principles

| Source of truth | Owns |
|-----------------|------|
| External bot (e.g. Discord) | Active character, inventory, phone item ownership |
| GULFOS API | Phone data: messages, calls, contacts, photos, files, apps, settings |

Each character has an isolated phone. No phone data is shared between characters, even for the same external account.

## Request Context

Every bot → GULFOS internal request must include:

| Header | Required | Description |
|--------|----------|-------------|
| `X-Service-Token` | Yes | Service auth (V1) |
| `X-Platform` | No (default `discord`) | Platform identifier |
| `X-External-User-Id` | Yes | External account ID (e.g. Discord User ID) |
| `X-Character-Id` | Yes | Active character ID |
| `X-Character-Session-Id` or `X-Inventory-Session-Id` | One required | Active session attestation |
| `X-Phone-Id` | For verify | Registered phone ID |
| `X-Device-Id` | For verify | Registered device UUID |

Same fields may be sent in JSON body for POST endpoints.

## Verification (5 checks)

Before phone access, `verifyPhoneAccess` validates:

1. External user is linked to a GULFOS account (`ExternalAccountLink`)
2. Character ID is the **active** character (`CharacterSession`)
3. Phone item exists in inventory (`InventoryAttestation.hasPhoneItem`)
4. Phone is registered and owned by this character (`CharacterPhone`)
5. `phoneId` / `deviceId` match the registered phone

Any failure returns `403` with a specific error code (e.g. `PHONE_ID_MISMATCH`).

## Internal API

All routes under `/api/internal/character/*` require service token auth.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/account/link` | Link external user → GULFOS user |
| `POST` | `/register` | Register/update character |
| `POST` | `/phone/bind` | Bind phone to character |
| `POST` | `/session/open` | Open active character session |
| `POST` | `/changed` | Character switch event |
| `POST` | `/inventory/attest` | Store inventory attestation from bot |
| `POST` | `/phone/verify` | Run full verification |
| `GET` | `/session/active` | Get active session for user |
| `GET` | `/phone` | Get character's registered phone |

### Character switch flow

```
Bot: POST /api/internal/character/changed
  → End previous CharacterSession
  → Emit character:session:ended (socket)
  → Store inventory attestation
  → Open new session
  → Emit character:changed + character:phone:activated
```

## Data Models

| Model | Purpose |
|-------|---------|
| `ExternalAccountLink` | External user ↔ GULFOS user |
| `Character` | Character registry |
| `CharacterPhone` | Phone ownership (1:1 per character) |
| `CharacterSession` | Active character session |
| `InventoryAttestation` | Cached bot inventory proof |

## Phone Data Scoping

Core phone models include optional `phoneId` and `characterRecordId` fields:

- `SimCard`, `Contact`, `PhoneCall`, `MailMessage`, `GalleryItem`, `FileNode`, `InstalledPackage`

Use `phoneScopeService` to build queries scoped by `phoneId` once verification succeeds. Full service migration is incremental; new data should set `phoneId` when a character session is active.

## Socket Events

| Event | When |
|-------|------|
| `character:changed` | Active character switched |
| `character:session:ended` | Previous phone session ended |
| `character:phone:activated` | New character phone ready |

## File Map

```
apps/api/src/constants/characterPhone.ts
apps/api/src/database/models/Character*.ts
apps/api/src/database/models/ExternalAccountLink.ts
apps/api/src/database/models/InventoryAttestation.ts
apps/api/src/services/characterPhoneService.ts
apps/api/src/services/characterSessionService.ts
apps/api/src/services/phoneScopeService.ts
apps/api/src/api/middleware/characterContext.ts
apps/api/src/api/controllers/characterInternalController.ts
```

## V2 Discord Integration

V2 will add the Discord bot worker that calls these endpoints. No Discord-specific code exists in this layer by design.
