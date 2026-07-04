# BananaOS Core Platform Service

The Core Platform is the **system layer** that connects all BananaOS applications. It is backend-only — no UI.

## Architecture

```
apps/api/src/platform/
  types.ts
  index.ts
  services/
    identityBridgeService.ts   # Global identity verification + cross-app sessions
    permissionEngineService.ts # Central RBAC across all apps
    auditService.ts            # Centralized audit logging
    eventBusService.ts         # Unified Socket.io event bus
    notificationService.ts     # Cross-app notification engine

apps/api/src/database/models/platform/
  CoreAuditLog.ts              # Shared audit collection
  CorePermission.ts            # Shared RBAC collection
  PlatformAppSession.ts        # Cross-app session tracking
```

## API (`/api/platform`)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Platform health + connected users |
| `GET /identity/context` | Identity context for current user |
| `POST /identity/verify` | Verify identity gate for an app |
| `POST /identity/session/link` | Link app session across platform |
| `GET /identity/sessions` | Active cross-app sessions |
| `GET /identity/cross-app/:targetUserId` | Cross-app identity lookup |
| `POST /permissions/check` | Check RBAC permission |
| `GET /permissions?appId=` | List user permissions for app |
| `POST /permissions/grant` | Admin: grant permissions |
| `POST /audit/log` | Push audit log entry |
| `GET /audit/logs` | Query centralized audit logs |
| `GET /audit/stats` | Admin: audit statistics |
| `POST /notifications/send` | Send unified notification |

## Connected Apps

| App | Bundle ID | Platform Integration |
|-----|-----------|---------------------|
| Identity | `com.bananaos.identity` | Identity bridge source |
| Bank | `com.bananaos.bank` | Audit + notifications + events |
| SIM | `com.bananaos.sim` | RBAC + audit + notifications |
| Contacts | `com.bananaos.contacts` | RBAC + audit + notifications |
| Police | `com.bananaos.police` | RBAC + audit + notifications + events |
| Justice | `com.bananaos.justice` | Full platform consumer (`/api/justice`) |

## Services

### identityBridgeService
- Central identity verification for gated apps (Bank, SIM, Police, Justice)
- Cross-app session linking via `PlatformAppSession`
- Cross-app identity lookup with `IdentityPermission` checks

### permissionEngineService
- Unified `hasPermission` / `grantPermissions` / `revokePermission`
- Writes to `CorePermission` + syncs legacy per-app permission collections
- Admin role bypass

### auditService
- All apps push logs to `CoreAuditLog`
- Dual-writes to legacy audit collections (backward compatible)
- Paginated query + stats

### eventBusService
- Wraps Socket.io (`emitToUser`, `broadcast`)
- All realtime events route through this layer

### notificationService
- Creates `Notification` records
- Emits `notification:new` + app-specific domain events
- System broadcast support

## Justice Integration

Justice (`/api/justice`) is the first app built entirely on the platform layer:
- Uses `permissionEngineService` for RBAC
- Uses `identityBridgeService` for identity gate
- Uses `auditService` for all lookups
- Uses `notificationService` for court updates
- Queries Police data through platform-audited lookups

## Migration Strategy

Existing apps delegate to platform services internally. Route URLs and legacy MongoDB collections are unchanged. The platform layer adds centralized collections without breaking existing admin panels or app-specific audit endpoints.

## Shared Constants

`packages/shared/src/appIds.ts` — canonical bundle IDs and identity-gated app list.
