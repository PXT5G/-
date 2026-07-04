# GULF Justice — com.gulfos.justice

Phase 4 App 11 delivers the official court and judicial system of GULFOS. The Judicial MDT is built into the app for prosecutors, judges, and court staff with full RBAC, audit logging, digital signatures, and realtime synchronization.

| Field | Value |
|-------|-------|
| Bundle ID | `com.gulfos.justice` |
| API Base | `/api/justice/*` |
| Store Category | Utilities (Government) |
| Storage | 950 MB |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 GULF Justice MDT (Frontend)                      │
│        JusticeApp → useJustice → justiceService → Socket.io      │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   justiceService  justiceRBAC  justiceIntegration  Calendar
   (CRUD)         Service       Service             (hearings)
       │          │          │          │
       ▼          ▼          ▼          ▼
   MongoDB      Role Config  Police MDT/Identity/   Notification
   18 models    Permissions  Bank/Phone/Chat        Broker
```

### Design principles

- **Judicial MDT built-in**: All court tools live inside `com.gulfos.justice`
- **RBAC-first**: 8 configurable roles with 60+ granular permissions
- **Audit everything**: Every action logs to `AuditLog` + `JusticeDutyLog`
- **Digital signatures**: SHA-256 signatures on judgments, sentences, warrants, subpoenas
- **Realtime**: Socket.io events for courtroom live updates, case/hearing/warrant changes
- **Police integration**: Imports pending court cases, warrant reviews, contested citations

## Roles & Permissions

| Role | Key capabilities |
|------|------------------|
| Chief Judge | Full access including RBAC configuration |
| Judge | All except RBAC configure |
| Magistrate | Warrants, hearings, limited admin |
| Prosecutor | Cases, charges, evidence, subpoenas, search |
| Defense Attorney | Cases, appeals, witnesses, limited search |
| Court Clerk | Docket, hearings, calendar, citations review |
| Bailiff | Courtroom live updates, docket view |
| Court Admin | Operations without sentencing/judgment issuance |

Permissions are stored in `JusticeRoleConfig` and configurable via `PATCH /api/justice/rbac`.

## Database Collections

| Collection | Purpose |
|------------|---------|
| `JusticeOfficial` | Court staff profile, role, bar number, signature |
| `JusticeRoleConfig` | Configurable RBAC per role |
| `JusticeDutyLog` | Duty action audit trail |
| `JusticeSearchLog` | MDT search history |
| `JusticeCourtroom` | Courtroom registry with live session |
| `JusticeCase` | Court cases linked to police cases |
| `JusticeHearing` | Scheduled hearings with live updates |
| `JusticeTrial` | Trial management with verdict |
| `JusticeCharge` | Filed charges per case |
| `JusticeLaw` | Statute database |
| `JusticeSentence` | Issued sentences (fine, prison, probation, etc.) |
| `JusticeWarrant` | Warrant review queue from police |
| `JusticeAppeal` | Appeal filings and decisions |
| `JusticeWitness` | Witness registry per case |
| `JusticeEvidence` | Court evidence with chain of custody |
| `JusticeSubpoena` | Issued subpoenas |
| `JusticeJudgment` | Court judgments with digital signatures |
| `JusticeDocket` | Published daily court dockets |

## API

All endpoints mount at `/api/justice/*` with authentication required.

### Core MDT

```
POST  /api/justice/initialize     — Register official, seed courtrooms/laws
GET   /api/justice/dashboard      — MDT dashboard with stats
PATCH /api/justice/status           — Update official duty status
```

### Cases & Calendar

```
GET   /api/justice/cases            — List cases
GET   /api/justice/cases/:id        — Case detail with charges, evidence, hearings
POST  /api/justice/cases            — File new case
PATCH /api/justice/cases/:id        — Update case status/assignments
GET   /api/justice/hearings         — List hearings
POST  /api/justice/hearings         — Schedule hearing (creates calendar event)
PATCH /api/justice/hearings/:id     — Update hearing / live courtroom message
GET   /api/justice/trials           — List trials
POST  /api/justice/trials           — Schedule trial
PATCH /api/justice/trials/:id       — Update trial / verdict
GET   /api/justice/docket           — Published dockets
POST  /api/justice/docket           — Publish docket
```

### Court Operations

```
GET   /api/justice/warrants         — Warrant review queue
PATCH /api/justice/warrants/:id/review — Approve/deny warrant (syncs to Police MDT)
GET   /api/justice/citations/contested — Contested citations from police
PATCH /api/justice/citations/:id/resolve — Uphold/dismiss/reduce citation
POST  /api/justice/sentences        — Issue sentence
POST  /api/justice/judgments        — Issue judgment
POST  /api/justice/subpoenas        — Issue subpoena
GET   /api/justice/appeals          — List appeals
POST  /api/justice/appeals          — File appeal
PATCH /api/justice/appeals/:id      — Update appeal decision
```

### Evidence & Staff

```
GET   /api/justice/evidence         — List evidence
POST  /api/justice/evidence         — Add evidence
PATCH /api/justice/evidence/:id/custody — Chain of custody transfer/admit
GET   /api/justice/witnesses        — List witnesses
POST  /api/justice/witnesses        — Add witness
GET   /api/justice/charges          — List charges
POST  /api/justice/charges          — File charge
GET   /api/justice/laws             — Statute database
GET   /api/justice/officials        — Court staff directory
GET   /api/justice/courtrooms       — Courtroom registry
POST  /api/justice/courtrooms/:id/live — Live courtroom broadcast
```

### Search & Analytics

```
POST  /api/justice/search           — Judicial search (citizen, case, bank, etc.)
GET   /api/justice/analytics        — Court analytics
GET   /api/justice/rbac             — Role permission configs
PATCH /api/justice/rbac             — Update role permissions
```

### Search Types

| Type | Permission | Data Source |
|------|------------|-------------|
| `citizen` | `search.citizen` | Identity + police records |
| `identity` | `search.identity` | User database |
| `phone` | `search.phone` | Phone/carrier/world engine |
| `vehicle` | `search.vehicle` | Plate/citation lookup |
| `property` | `search.property` | Organization registry |
| `business` | `search.business` | Organization registry |
| `weapon` | `search.weapon` | Weapon license check |
| `case` | `search.case` | Justice case database |
| `evidence` | `search.evidence` | Court + police evidence |
| `report` | `search.report` | Police reports |
| `bank` | `search.bank` | Bank records (permission controlled) |

## Ecosystem Integrations

| System | Integration |
|--------|-------------|
| GULF Police MDT | Import `pending_court` cases, warrant reviews, contested citations |
| Identity | Citizen search, defendant linking |
| Bank | Fine/outstanding balance lookup (RBAC gated) |
| Phone | Phone record search |
| Contacts | Witness/recipient lookup |
| GULF Chat | `justice` conversation type |
| Communication Core | Court messaging |
| World Engine | GPS evidence, location records |
| Maps | Courtroom/address references |
| Browser | `justice.gulfos.gov` portal deep link |
| Notification Broker | Hearing/sentence/warrant notifications |
| Permission Broker | App install + granular permission checks |
| Device Ecosystem | Device UUID in audit logs |
| Calendar | `justice_hearing` event type auto-created |

## Realtime Socket Events

```
justice:initialized
justice:case:update
justice:hearing:update
justice:trial:update
justice:evidence:update
justice:warrant:review
justice:appeal:update
justice:judgment:issued
justice:sentence:issued
justice:courtroom:live
justice:docket:update
justice:notification
justice:search:complete
justice:subpoena:issued
justice:citation:resolved
```

## Frontend

The Justice MDT UI (`apps/web/src/apps/justice/`) features:

- Glassmorphism design matching GULFOS premium aesthetic
- Tab navigation: MDT, Docket, Cases, Hearings, Search, More
- Realtime sync via `useJusticeSocketSync`
- Warrant approve/deny workflow
- Contested citation resolution
- Full judicial search with 11 search types
- Analytics dashboard with case status breakdown

## Security

- Granular RBAC with 8 roles and 60+ permissions
- All actions logged to `AuditLog` and `JusticeDutyLog`
- Digital signatures (SHA-256) on legal documents
- Bank search requires explicit `search.bank` permission
- Permission Broker validates app installation

## Seeded Data

On first initialize:

- 4 courtrooms (101, 102, 201, Magistrate)
- 8 statutes (PC-187, PC-211, PC-484, VC-22350, VC-23152, PC-415, PC-245, PC-148)
- Auto-import of police cases with `pending_court` status
- Auto-import of police warrants awaiting judicial review
