# Identity — Digital Identity System

> Phase 3 — App 02 (Complete)  
> Bundle ID: `com.bananaos.identity`

## Overview

Identity is the official digital identity system for every BananaOS user. It provides a premium animated identity card with glassmorphism design, QR/barcode verification, security controls, document export, and an admin verification panel. All other BananaOS applications depend on Identity for authentication, permissions, and verification.

## Features

| Feature | Status |
|---------|--------|
| Premium Identity Card (Front/Back) | ✅ |
| Card Flip Animation | ✅ |
| Glassmorphism Design | ✅ |
| Avatar, Name, Username, ID | ✅ |
| Membership Level & Number | ✅ |
| Animated QR Code | ✅ |
| Animated Barcode | ✅ |
| Digital Signature | ✅ |
| Profile (Bio, Org, Badges) | ✅ |
| Security (PIN, 2FA, Biometrics) | ✅ |
| Trusted Devices & Sessions | ✅ |
| QR/Barcode/API Verification | ✅ |
| Verification History | ✅ |
| PDF Download | ✅ |
| Share & Print | ✅ |
| Temporary Pass | ✅ |
| Notifications | ✅ |
| Admin Panel | ✅ |
| Identity API for Other Apps | ✅ |

## Architecture

```
apps/web/src/apps/identity/
├── index.tsx                    # Root component + tab navigation
├── manifest.ts                  # App manifest
├── types.ts                     # TypeScript interfaces
├── store/identityStore.ts       # Zustand state
├── services/identityService.ts  # API client
├── components/
│   ├── IdentityCard.tsx         # Flippable glass card
│   ├── IdentityTabBar.tsx       # Tab navigation
│   ├── QRDisplay.tsx            # Animated QR
│   ├── BarcodeDisplay.tsx       # CODE128 barcode
│   └── SkeletonCard.tsx         # Loading skeleton
└── screens/
    ├── HomeScreen.tsx           # Identity card home
    ├── SetupScreen.tsx          # Create identity
    ├── ProfileScreen.tsx        # Profile & activity
    ├── SecurityScreen.tsx       # PIN, 2FA, sessions
    ├── VerificationScreen.tsx   # Generate & verify
    ├── DocumentsScreen.tsx      # PDF, share, temp pass
    ├── NotificationsScreen.tsx  # Identity alerts
    └── AdminScreen.tsx          # Admin verification queue

apps/api/src/
├── database/models/
│   ├── Identity.ts
│   ├── IdentityHistory.ts
│   ├── VerificationLog.ts
│   ├── IdentityPermission.ts
│   ├── IdentitySettings.ts
│   ├── TrustedDevice.ts
│   └── TemporaryPass.ts
├── services/identityService.ts
├── api/controllers/
│   ├── identityController.ts
│   └── identityAdminController.ts
└── api/routes/identity.ts

apps/web/src/services/identityApi.ts  # Shared API for other apps
```

## Database Models

| Model | Purpose |
|-------|---------|
| `Identity` | Core identity record (national ID, membership, QR, signature) |
| `IdentityHistory` | Audit trail of all identity changes |
| `VerificationLog` | QR/barcode/API verification attempts |
| `IdentityPermission` | App-level access permissions |
| `IdentitySettings` | PIN, 2FA, biometrics, notification prefs |
| `TrustedDevice` | Registered trusted devices |
| `TemporaryPass` | 24-hour temporary access codes |

### ID Formats

- **National ID:** `BN-YYYY-NNNNNN` (e.g. `BN-2026-123456`)
- **Membership:** `MBR-NNNNNNNN` (e.g. `MBR-12345678`)

## API Endpoints

### User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/identity` | Yes | Create identity |
| GET | `/api/identity/me` | Yes | Get my identity |
| PATCH | `/api/identity/me` | Yes | Update identity |
| GET | `/api/identity/me/pdf` | Yes | Download PDF |
| GET | `/api/identity/me/qr` | Yes | Generate QR data |
| POST | `/api/identity/verify` | Yes | Verify identity |
| GET | `/api/identity/search` | Yes | Search identities |
| GET | `/api/identity/:nationalId` | Yes | Get by national ID |
| GET | `/api/identity/me/permissions` | Yes | List permissions |
| POST | `/api/identity/me/permissions` | Yes | Grant permission |
| DELETE | `/api/identity/me/permissions/:appId/:permission` | Yes | Revoke permission |
| GET | `/api/identity/me/sessions` | Yes | Active sessions |
| DELETE | `/api/identity/me/sessions/:id` | Yes | Revoke session |
| GET/PATCH | `/api/identity/me/settings` | Yes | Security settings |
| POST | `/api/identity/me/settings/pin` | Yes | Set PIN |
| GET | `/api/identity/me/devices` | Yes | Trusted devices |
| POST | `/api/identity/me/temp-pass` | Yes | Generate temp pass |
| GET | `/api/identity/me/notifications` | Yes | Identity notifications |
| GET | `/api/identity/me/stats` | Yes | Identity statistics |
| POST | `/api/identity/me/share` | Yes | Share identity data |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/identity/admin/queue` | Admin | Pending verifications |
| GET | `/api/identity/admin/search` | Admin | Search all identities |
| GET | `/api/identity/admin/stats` | Admin | System statistics |
| GET | `/api/identity/admin/audit` | Admin | Audit logs |
| POST | `/api/identity/admin/:id/approve` | Admin | Approve identity |
| POST | `/api/identity/admin/:id/reject` | Admin | Reject identity |
| POST | `/api/identity/admin/:id/suspend` | Admin | Suspend identity |
| POST | `/api/identity/admin/:id/reactivate` | Admin | Reactivate identity |

## Components

### IdentityCard
Premium flippable card with glassmorphism. Front shows avatar, identity fields, animated QR and barcode. Back shows emergency contact, additional info, badges, and BananaOS seal.

### QRDisplay / BarcodeDisplay
Animated QR code (react-qr-code) and CODE128 barcode (jsbarcode) for verification.

### IdentityTabBar
Six-tab navigation with optional admin tab for admin users.

## Flows

### Identity Creation
1. User opens Identity app (must be signed in)
2. Setup screen collects profile data
3. API creates identity with generated national ID and membership number
4. Identity enters `pending` status awaiting admin verification

### Verification
1. Verified identity generates signed QR payload
2. Other apps call `POST /api/identity/verify` with payload, barcode, or national ID
3. System validates HMAC signature, status, and expiry
4. Verification logged; user notified

### Admin Approval
1. Admin opens Admin tab in Identity app
2. Reviews pending queue
3. Approves → status `verified`, membership upgraded to gold
4. Rejects/Suspends → user notified

## Permissions

Apps request identity permissions via `IdentityPermission`:

```typescript
import { identityApi } from '@/services/identityApi';

// Bank app verifying a customer
const result = await identityApi.verifyQr(payload, 'com.bananaos.bank');

// Request read permission
await identityApi.requestPermission('com.bananaos.bank', 'read:profile');
```

Supported consuming apps: Bank, Phone, SIM Card, Police, Justice, and future apps.

## Integration

- Registered in `registerSystemApps.ts` as system app
- Listed in Banana App store (`com.bananaos.identity`)
- Exposes `identityApi` shared service for cross-app verification
- Socket events: `identity:verified`, `identity:updated`, `identity:expiry`

## Tests

```bash
npm run test --workspace=@bananaos/web
```

- Identity validation schemas (create, verify, PIN)
- National ID and membership number format
- Bundle ID convention

## Future Roadmap

- NFC tap-to-verify
- Government ID document upload
- Blockchain-anchored signatures
- Multi-language identity cards
- Family/dependent identities
- Real-time verification webhooks for third-party apps
