# GULF EMS — com.gulfos.ems

Phase 4 App 12 delivers the official Emergency Medical Services platform of GULFOS. The built-in EMS MDT serves paramedics, nurses, doctors, dispatchers, and hospital staff with full RBAC, audit logging, medical record access logs, digital signatures, and realtime synchronization.

| Field | Value |
|-------|-------|
| Bundle ID | `com.gulfos.ems` |
| API Base | `/api/ems/*` |
| Store Category | Utilities (Government) |
| Storage | 1.1 GB |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GULF EMS MDT (Frontend)                       │
│           EmsApp → useEms → emsService → Socket.io               │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   emsService   emsRBAC    emsIntegration   World Engine   Maps
   (CRUD)       Service    Service          (GPS/ETA)      (routing)
       │          │          │          │
       ▼          ▼          ▼          ▼
   MongoDB      Role Config  Police/Identity/   Notification
   19 models    Permissions  Bank/Phone/Chat    Broker
```

### Design principles

- **EMS MDT built-in**: All emergency medical tools live inside `com.gulfos.ems`
- **RBAC-first**: 9 configurable roles with 60+ granular permissions
- **Medical privacy**: Dedicated `EmsMedicalAccessLog` for every record access
- **Audit everything**: Every action logs to `AuditLog` + `EmsDutyLog`
- **Realtime**: Live ambulance GPS, dispatch updates, hospital capacity, emergency alerts
- **Ecosystem integration**: Police 911 calls, Identity, Bank, World Engine, Maps routing

## Roles & Permissions

| Role | Key capabilities |
|------|------------------|
| Chief EMS | Full access including RBAC configuration |
| Deputy | All except RBAC configure |
| Doctor | Patients, records, treatments, prescriptions, hospital |
| Surgeon | Surgery, OR management, admissions |
| Paramedic | Dispatch response, treatments, patient creation, GPS |
| Nurse | Patient care, admissions, pharmacy, queue |
| Dispatcher | 911, unit assignment, helicopter, mass casualty |
| Trainee | Read-only MDT access |
| Administrator | Operations without clinical prescribing |

Permissions are stored in `EmsRoleConfig` and configurable via `PATCH /api/ems/rbac`.

## Database Collections

| Collection | Purpose |
|------------|---------|
| `EmsPersonnel` | EMS staff profile, role, license, GPS |
| `EmsRoleConfig` | Configurable RBAC per role |
| `EmsDutyLog` | Duty action audit trail |
| `EmsMedicalAccessLog` | Medical record access audit |
| `EmsSearchLog` | MDT search history |
| `EmsUnit` | Ambulance/response units with live GPS |
| `EmsAmbulance` | Ambulance vehicle registry |
| `EmsDispatch` | 911 medical calls and dispatches |
| `EmsPatient` | Patient demographics, allergies, insurance |
| `EmsMedicalRecord` | Vitals, diagnoses, injuries, operations, lab results |
| `EmsTreatment` | Administered treatments |
| `EmsPrescription` | Prescriptions with digital signatures |
| `EmsHospital` | Hospital registry with capacity |
| `EmsDepartment` | ER, ICU, Surgery, Pharmacy departments |
| `EmsBed` | Bed management per department |
| `EmsAdmission` | Admissions, discharge, waiting queue |
| `EmsIncident` | Mass casualty and multi-vehicle incidents |

## API

All endpoints mount at `/api/ems/*` with authentication required.

### Core MDT

```
POST  /api/ems/initialize     — Register personnel, seed units/hospitals
GET   /api/ems/dashboard      — MDT dashboard with stats and hospital capacity
PATCH /api/ems/status           — Update personnel duty status
```

### Dispatch & Units

```
GET   /api/ems/units            — List units with live GPS
PATCH /api/ems/units/:id/gps    — Update unit/ambulance GPS
GET   /api/ems/dispatches       — List dispatches
POST  /api/ems/dispatches       — Create dispatch (auto-routes nearest hospital)
PATCH /api/ems/dispatches/:id   — Update dispatch status
POST  /api/ems/dispatches/:id/assign     — Assign ambulance unit
POST  /api/ems/dispatches/:id/route      — Route to hospital
POST  /api/ems/dispatches/:id/helicopter — Dispatch air med
```

### Patients & Medical Records

```
GET   /api/ems/patients         — List patients
GET   /api/ems/patients/:id     — Patient detail with records/treatments
POST  /api/ems/patients         — Create patient
GET   /api/ems/records          — List medical records
POST  /api/ems/records          — Create record with vitals/injuries
POST  /api/ems/treatments       — Record treatment
POST  /api/ems/prescriptions    — Issue prescription
```

### Hospital Management

```
GET   /api/ems/hospitals        — List hospitals with capacity
GET   /api/ems/hospitals/:id    — Hospital detail with departments/beds
POST  /api/ems/admissions       — Admit patient (auto-assigns bed)
PATCH /api/ems/admissions/:id/discharge — Discharge patient
```

### Operations

```
GET   /api/ems/ambulances       — Ambulance fleet
GET   /api/ems/incidents        — Mass casualty incidents
POST  /api/ems/incidents        — Declare incident
GET   /api/ems/personnel        — EMS staff directory
POST  /api/ems/search           — Patient/medical search
GET   /api/ems/analytics        — EMS analytics
POST  /api/ems/alert            — Broadcast emergency alert
GET   /api/ems/rbac             — Role permission configs
PATCH /api/ems/rbac             — Update role permissions
```

### Search Types

| Type | Permission | Data Source |
|------|------------|-------------|
| `citizen` | `search.citizen` | Identity + medical history |
| `identity` | `search.identity` | User database |
| `phone` | `search.phone` | Phone/carrier/world engine |
| `record` | `search.record` | Medical records + patients |
| `blood_type` | `search.blood_type` | Patient blood type registry |
| `emergency_contact` | `search.emergency_contact` | Patient emergency contacts |
| `insurance` | `search.insurance` | Insurance provider/policy |
| `allergies` | `search.allergies` | Patient allergy registry |
| `treatments` | `search.treatments` | Treatment history |

## Ecosystem Integrations

| System | Integration |
|--------|-------------|
| GULF Police | Medical 911 call cross-reference, police dispatch linking |
| GULF Justice | Patient records for court-related cases |
| GULF Maps | Hospital routing, ambulance GPS display |
| World Engine | Live personnel/unit GPS, ETA calculation |
| Identity | Citizen search, patient linking |
| Bank | Insurance verification via bank integration |
| Phone | Phone record search |
| Contacts | Emergency contact lookup |
| GULF Chat | Emergency messaging via Communication Core |
| Notification Broker | 911/dispatch/incident alerts |
| Permission Broker | App install + granular permission checks |
| Device Ecosystem | Device UUID in audit logs |

## Realtime Socket Events

```
ems:initialized
ems:dispatch:new
ems:dispatch:update
ems:unit:update
ems:personnel:status
ems:911:new
ems:patient:update
ems:ambulance:gps
ems:hospital:capacity
ems:incident:update
ems:alert
ems:helicopter:dispatch
ems:search:complete
ems:admission:update
ems:queue:update
```

## Frontend

The EMS MDT UI (`apps/web/src/apps/ems/`) features:

- Glassmorphism design with red/gold emergency accents
- Tab navigation: MDT, Units, Dispatch, Patients, Search, More
- Live hospital capacity bars on dashboard
- Dispatch workflow: assign unit → route hospital → air med
- 9 search types for patient/medical lookup
- Realtime sync via `useEmsSocketSync`

## Security

- Granular RBAC with 9 roles and 60+ permissions
- All actions logged to `AuditLog` and `EmsDutyLog`
- Medical record access logged to `EmsMedicalAccessLog`
- Digital signatures (SHA-256) on prescriptions and records
- Permission Broker validates app installation

## Seeded Data

On first initialize:

- 5 EMS units (Alpha, Bravo, Charlie, Dispatch, Air Med)
- 4 ambulances including helicopter
- 3 hospitals (General, Trauma Center, Community) with departments and beds
- Auto ETA calculation and nearest hospital routing
