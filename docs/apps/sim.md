# Banana SIM — Telecommunications System

> Phase 3 — App 04 (Complete)  
> Bundle ID: `com.bananaos.sim`

## Overview

Banana SIM is the complete telecommunications system for BananaOS. Every verified Identity automatically receives a SIM profile, unique phone number, and network subscription on Banana Mobile. Phone, SMS, Contacts, Messenger, Police, and Justice depend on this app.

## Features

| Feature | Status |
|---------|--------|
| Premium Dashboard with Signal Animation | ✅ |
| Phone Number Management | ✅ |
| SIM Activate/Deactivate/Suspend/Replace | ✅ |
| Call Settings (Caller ID, Forwarding, Voicemail) | ✅ |
| SMS Settings (Backup, Spam Filter) | ✅ |
| Network (4G/5G/LTE, WiFi Calling, Roaming) | ✅ |
| Security (SIM PIN, PUK, Biometrics, Blocked Numbers) | ✅ |
| Full RBAC Permission System | ✅ |
| Complete Audit Logging | ✅ |
| Admin Panel | ✅ |
| Realtime Socket Updates | ✅ |
| Identity Integration | ✅ |

## Architecture

```
apps/web/src/apps/sim/
├── index.tsx
├── manifest.ts
├── types.ts
├── store/simStore.ts
├── services/simService.ts
├── hooks/useSimRealtime.ts
├── components/
│   ├── SimTabBar.tsx
│   └── SignalAnimation.tsx
└── screens/
    ├── HomeScreen.tsx
    ├── NumbersScreen.tsx
    ├── SIMManagementScreen.tsx
    ├── CallSettingsScreen.tsx
    ├── SMSSettingsScreen.tsx
    ├── NetworkScreen.tsx
    ├── SecurityScreen.tsx
    ├── NotificationsScreen.tsx
    └── AdminScreen.tsx

apps/api/src/
├── database/models/
│   ├── SIMProfile.ts
│   ├── PhoneNumber.ts
│   ├── Carrier.ts
│   ├── Voicemail.ts
│   ├── CallSettings.ts
│   ├── SMSSettings.ts
│   ├── NetworkSettings.ts
│   ├── BlockedNumber.ts
│   ├── SIMAuditLog.ts
│   ├── SIMPermission.ts
│   └── SIMSecuritySettings.ts
├── services/simService.ts
├── api/controllers/
│   ├── simController.ts
│   └── simAdminController.ts
└── api/routes/sim.ts

apps/web/src/services/simApi.ts  # Shared API for Phone, SMS, etc.
```

## Database Schema

| Model | Purpose |
|-------|---------|
| `SIMProfile` | SIM card profile linked to Identity |
| `PhoneNumber` | Unique phone numbers (+1-BNA-XXX-XXXX) |
| `Carrier` | Network carrier (Banana Mobile) |
| `Voicemail` | Voicemail settings |
| `CallSettings` | Caller ID, forwarding, spam protection |
| `SMSSettings` | SMS center, delivery reports, backup |
| `NetworkSettings` | Signal, 4G/5G/LTE, roaming |
| `BlockedNumber` | Blocked callers/SMS senders |
| `SIMAuditLog` | Full audit trail with old/new values |
| `SIMPermission` | RBAC permissions per user |
| `SIMSecuritySettings` | SIM PIN, PUK, biometrics |

### Number Format

- **Standard:** `+1-BNA-555-XXXX`
- **Premium:** `+1-BNA-888-XXXX`
- **ICCID:** `8944001` + 12 digits

## RBAC Permissions

| Permission | User | Admin | Description |
|------------|------|-------|-------------|
| `view_sim` | ✅ | ✅ | View SIM dashboard and settings |
| `edit_sim` | ✅ | ✅ | Modify settings |
| `activate` | ✅ | ✅ | Activate SIM |
| `deactivate` | ✅ | ✅ | Deactivate SIM |
| `suspend` | ❌ | ✅ | Suspend SIM (admin) |
| `replace` | ❌ | ✅ | Replace SIM profile |
| `generate_numbers` | ❌ | ✅ | Generate phone numbers |
| `assign_numbers` | ❌ | ✅ | Assign numbers to users |
| `manage_carriers` | ❌ | ✅ | Manage carriers |
| `view_audit_logs` | ❌ | ✅ | View audit logs |
| `change_number` | ✅ | ✅ | Change phone number |
| `reserve_number` | ✅ | ✅ | Reserve a number |
| `release_number` | ✅ | ✅ | Release reserved number |

Every action checks permissions before execution. Admins bypass checks via role.

## Audit Log

Every action records:
- User, timestamp, device, IP
- Action, permission used
- Old value, new value, reason

Logged actions include: provisioning, activation, suspension, number changes, settings updates, blocks, PIN changes.

## API Endpoints

### User (`/api/sim/*`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/provision` | activate | Provision SIM for verified identity |
| GET | `/dashboard` | view_sim | Dashboard with signal/network |
| GET | `/profiles` | view_sim | List SIM profiles |
| POST | `/profiles/:id/activate` | activate | Activate SIM |
| POST | `/profiles/:id/deactivate` | deactivate | Deactivate SIM |
| POST | `/profiles/:id/suspend` | suspend | Suspend SIM |
| POST | `/profiles/:id/replace` | replace | Replace SIM |
| POST | `/numbers/reserve` | reserve_number | Reserve number |
| POST | `/numbers/:id/release` | release_number | Release number |
| GET/PATCH | `/settings/call` | view/edit_sim | Call settings |
| GET/PATCH | `/settings/sms` | view/edit_sim | SMS settings |
| GET/PATCH | `/settings/network` | view/edit_sim | Network settings |
| POST | `/settings/network/diagnostic` | view_sim | Run diagnostics |
| GET/PATCH | `/security` | view/edit_sim | Security settings |
| GET | `/numbers/lookup/:number` | view_sim | Lookup number (for other apps) |
| GET | `/carrier/status` | view_sim | Carrier status API |
| GET | `/signal/status` | view_sim | Signal status API |

### Admin (`/api/sim/admin/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | SIM statistics |
| GET | `/admin/sims` | Search SIM profiles |
| POST | `/admin/sims/:id/suspend` | Admin suspend |
| POST | `/admin/sims/:id/activate` | Admin activate |
| POST | `/admin/numbers/generate` | Generate/assign numbers |
| GET | `/admin/audit` | Full audit logs |
| GET/POST | `/admin/carriers` | Manage carriers |
| POST | `/admin/permissions/grant` | Grant permissions |

## Flows

### SIM Provisioning
1. User has verified Identity
2. Open Banana SIM → Activate
3. System generates unique `+1-BNA-555-XXXX` number
4. Creates eSIM profile on Banana Mobile
5. Initializes call, SMS, network, security settings
6. Grants default RBAC permissions

### Number Change
1. Reserve new number (standard or premium)
2. Change number on SIM profile
3. Old number released, new number assigned
4. Audit logged, notification sent

## Integration

```typescript
import { simApi } from '@/services/simApi';

// Phone app looking up a number
const info = await simApi.lookupNumber('+1-BNA-555-1234', 'com.bananaos.phone');

// Get user's number
const dashboard = await simApi.getMyNumber('com.bananaos.sms');
```

### Socket Events
- `sim:activated`, `sim:deactivated`, `sim:suspended`
- `sim:replaced`, `sim:number:changed`
- `sim:signal:updated`, `sim:notification`

## Tests

```bash
npm run test --workspace=@bananaos/web
```

## Future Roadmap

- Physical SIM provisioning workflow
- Multi-SIM dual standby
- International roaming packages
- Number porting from other carriers
- eSIM QR provisioning for secondary devices
- Integration with Phone app dialer
