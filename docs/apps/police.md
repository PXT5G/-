# Banana Police — com.bananaos.police

Phase 4 App 06 delivers a production Mobile Data Terminal (MDT) integrated into the Banana Police application. The MDT is built into the app — not a separate application — with full RBAC, audit logging, and realtime synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Banana Police MDT (Frontend)                    │
│         PoliceApp → usePolice → policeService → Socket.io        │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   policeService  policeRBAC  policeIntegration  World Engine
   (CRUD)        Service      Service            policeTracking
       │          │          │          │
       ▼          ▼          ▼          ▼
   MongoDB      Role Config  Identity/Bank/     Communication
   15+ models  Permissions  Phone/Maps         Core (police chat)
```

### Design principles

- **MDT built-in**: All law enforcement tools live inside `com.bananaos.police`
- **RBAC-first**: 14 configurable roles with 50+ granular permissions
- **Audit everything**: Every action logs to `AuditLog` + `PoliceDutyLog`
- **Realtime**: Socket.io events for dispatch, units, panic, BOLO, warrants
- **Integration**: World Engine tracking, Identity search, Bank fines, Communication Core

## Roles & Permissions

| Role | Key capabilities |
|------|------------------|
| Chief | Full access including RBAC configuration |
| Deputy Chief | All except RBAC configure |
| Captain / Lieutenant | Command operations, limited admin |
| Sergeant / Corporal / Officer | Patrol, citations, reports, search |
| Cadet | MDT view, duty log, training |
| Dispatcher | 911, dispatch management, unit assignment |
| Detective / Investigation | Cases, warrants, evidence, gangs |
| SWAT | Tactical ops, roadblocks, spikes, panic response |
| Traffic | Citations, impound, plate search |
| Air Support | GPS tracking, aerial units |

Permissions are stored in `PoliceRoleConfig` and configurable via `PATCH /api/police/rbac`.

## Database Collections

| Collection | Purpose |
|------------|---------|
| `PoliceOfficer` | Badge, rank, role, unit, GPS, status |
| `PoliceUnit` | Patrol units with radio channels |
| `PoliceDispatch` | 911 and active calls |
| `PoliceBolo` | Be On the Lookout alerts |
| `PoliceWarrant` | Arrest/search/bench warrants |
| `PoliceWanted` | Wanted persons database |
| `PoliceReport` | Incident, crime, arrest reports |
| `PoliceCitation` | Citations and warnings |
| `PoliceCase` | Case management with timeline |
| `PoliceEvidence` | Chain of custody evidence |
| `PoliceGang` | Gang database |
| `PoliceOrganization` | Business/organization records |
| `PoliceNote` | Officer notes |
| `PolicePanicEvent` | Panic button activations |
| `PoliceDutyLog` | Duty action audit trail |
| `PoliceSearchLog` | MDT search history |
| `PoliceRoleConfig` | Configurable RBAC per role |

## API

All endpoints mount at `/api/police/*` with authentication required.

### Core MDT

```
POST  /api/police/initialize     — Register officer, seed units
GET   /api/police/dashboard      — MDT dashboard with stats
PATCH /api/police/status         — Update officer duty status
POST  /api/police/panic          — Trigger officer panic
```

### Dispatch & 911

```
GET   /api/police/dispatches     — List dispatches (?is911=true)
POST  /api/police/dispatches     — Create dispatch/911 call
PATCH /api/police/dispatches/:id — Update status, assign unit
```

### Records

```
GET/POST /api/police/bolos       — BOLO management
GET/POST /api/police/warrants    — Warrant management
GET      /api/police/wanted       — Wanted list
GET/POST /api/police/reports     — Incident/crime/arrest reports
POST     /api/police/citations   — Citations and warnings
GET/POST /api/police/cases       — Case management
GET/POST /api/police/evidence    — Evidence with chain of custody
```

### MDT Search

```
POST /api/police/search
```

Search types: `person`, `vehicle`, `plate`, `property`, `business`, `phone`, `identity`, `weapon`

### Integrations

```
POST /api/police/track                    — World Engine GPS tracking
GET  /api/police/citizens/:userId/gps     — Live citizen GPS
GET  /api/police/citizens/:userId/bank    — Outstanding fines / bank
GET  /api/police/fine-calculator          — Fine and jail calculator
GET  /api/police/analytics                — Crime stats and heat map
GET/PATCH /api/police/rbac                — Role permission config
```

World Engine tracking also available at:
```
POST /api/world/police/track
GET  /api/world/police/history
```

## Localization

Police app UI is English-only (law enforcement standard). Citizen-facing integrations use the system i18n layer.

## Security

Every mutation:
1. Checks `checkPolicePermission(userId, permission)`
2. Requires `com.bananaos.police` app with `location` permission (or admin role)
3. Logs to `AuditLog` with actor, resource, IP, device UUID
4. Creates `PoliceDutyLog` entry for officer actions

## Realtime Events

| Event | Trigger |
|-------|---------|
| `police:dispatch:new` | New dispatch created |
| `police:911:new` | 911 call received |
| `police:dispatch:update` | Dispatch status changed |
| `police:officer:status` | Officer status/GPS update |
| `police:panic` | Panic button activated |
| `police:bolo:new` | New BOLO issued |
| `police:warrant:new` | New warrant issued |
| `police:case:update` | Case status changed |
| `police:evidence:new` | Evidence logged |
| `police:initialized` | Officer MDT ready |

## Frontend

```
apps/web/src/apps/police/
  manifest.ts          — App registration
  index.tsx            — MDT with tab navigation
apps/web/src/services/policeService.ts
apps/web/src/hooks/usePolice.ts
```

### MDT Tabs

1. **MDT** — Dashboard, stats, panic button, quick access
2. **Units** — Live units and officer status
3. **Dispatch** — 911 calls and active dispatches
4. **Search** — Person, plate, phone, identity, weapon searches
5. **More** — BOLO, wanted, warrants, reports, analytics

## Developer Guide

### Adding a new MDT feature

1. Add permission to `POLICE_PERMISSIONS` in `constants/police.ts`
2. Assign to roles in `DEFAULT_ROLE_PERMISSIONS`
3. Create Mongoose model in `database/models/`
4. Add service method in `policeService.ts` with `assertPolicePermission`
5. Add controller handler + route
6. Add frontend API method + hook + UI screen
7. Add socket event if realtime updates needed
8. Log via `logPoliceAction`

### Running tests

```bash
npm test --workspace=@bananaos/api
npm run build
```

## Integrations

| System | Integration |
|--------|-------------|
| World Engine | GPS tracking, district, towers, VPN detection |
| Identity | Citizen profile via User + DeviceProfile |
| Bank | Outstanding fines via PoliceCitation |
| Phone | 911 calls, phone number search |
| Maps | Roadblocks via system-apps/maps |
| Communication Core | `type: 'police'` conversations and messages |
| Notification Broker | Critical dispatch and panic alerts |
| Permission Broker | App-level location permission |
| Device Ecosystem | Officer device UUID in audit logs |
| Banana App Store | `com.bananaos.police` premium listing |
