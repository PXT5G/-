# Police App (`com.bananaos.police`)

Production-grade law enforcement platform for BananaOS with RBAC, audit logging, MDT queries, dispatch, cases, reports, rankings, and secure internal chat.

## Architecture

```
apps/api/src/
  database/models/Police*.ts     # MongoDB schemas
  services/policeService.ts      # Business logic + RBAC + audit
  api/controllers/police*.ts   # HTTP handlers
  api/routes/police.ts           # Route definitions

apps/web/src/apps/police/
  index.tsx                      # App shell + provisioning gate
  screens/                       # 9 module screens + admin
  services/policeService.ts      # Frontend API client
  hooks/usePoliceRealtime.ts     # Socket.io invalidation
```

## Modules

| Module | Screen | Permissions |
|--------|--------|-------------|
| Dashboard | `DashboardScreen` | `view_dashboard` |
| MDT | `MDTScreen` | `access_mdt`, `view_mdt_audit` |
| Reports | `ReportsScreen` | `create_report`, `approve_report`, `view_reports` |
| Rankings | `RankingsScreen` | `manage_rankings` |
| Officers | `OfficersScreen` | `view_officers`, `manage_officers` |
| Dispatch | `DispatchScreen` | `view_dispatch`, `manage_dispatch` |
| Cases | `CasesScreen` | `view_cases`, `manage_cases`, `manage_evidence` |
| Vehicles | `VehiclesScreen` | `view_vehicles`, `manage_vehicles` |
| Chat | `ChatScreen` | `internal_chat` (rank-gated channels) |

## RBAC

Ranks: `cadet` → `officer` → `sergeant` → `lieutenant` → `captain` → `chief`

Higher ranks inherit more permissions via `RANK_PERMISSIONS` in `PolicePermission.ts`. Promotions call `grantRankPermissions` to update the permission set.

## Audit Logging

Every sensitive action is logged to `PoliceAuditLog`:
- MDT searches include the `query` field
- Report approvals/rejections include `reason`
- Status changes include `oldValue` / `newValue`

## API Endpoints

Base: `/api/police`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/provision` | Register officer profile |
| GET | `/dashboard` | Live stats + alerts |
| GET | `/mdt/persons?q=` | Person search (Identity + Contacts) |
| GET | `/mdt/vehicles?q=` | Vehicle search |
| GET | `/mdt/properties?q=` | Property search |
| GET | `/mdt/cases?q=` | Case lookup |
| GET/POST | `/reports` | List / create reports |
| POST | `/reports/:id/review` | Approve or reject |
| GET/POST | `/dispatch` | List / create dispatches |
| GET/POST | `/cases` | List / create cases |
| GET/POST | `/chat` | Secure messaging |
| GET | `/officers` | Officer roster |

## Realtime Events

Socket events: `police:dispatch:*`, `police:report:*`, `police:case:created`, `police:chat:message`, `police:officer:status`, `police:rank:changed`, `police:notification`

## Shared API

`apps/web/src/services/policeApi.ts` exposes lookup helpers for Justice and other government apps.

## Security

- All routes require authentication
- Permission checks on every endpoint via `hasPermission` / `requirePermission`
- MDT access restricted by rank
- Chat channels gated by minimum rank (`command` = lieutenant+, `investigations` = sergeant+)
- Admin routes require `requireAdmin` middleware

## Performance

- Paginated lists (default 20 items)
- Dashboard refetch interval: 30s
- Dispatch refetch interval: 10s
- Chat refetch interval: 5s
- React Query cache invalidation via realtime hooks
