# Phase 5.2 — GULF Premium Native Applications

Personal banking and digital identity applications for GULFOS.

## Applications

| Bundle ID | Name | API Base |
|-----------|------|----------|
| `com.gulfos.bank` | GULF Bank | `/api/bank/*` |
| `com.gulfos.identity` | Digital Identity | `/api/identity/*` |

## Bank (`com.gulfos.bank`)

Personal banking separate from Business Platform company accounts.

### Features
- Dashboard with total balance, monthly spending, recent transactions
- Multiple accounts (checking, savings) with IBAN and wallet IDs
- Debit/credit/virtual cards with freeze/unfreeze controls
- Internal and external transfers with Live Activities
- QR payments, budget tracking, analytics
- Fraud alerts via Notification Broker

### Models
- `BankAccount` — personal accounts with IBAN, wallet, balances
- `BankCard` — debit/credit/virtual cards with limits
- `BankTransaction` — transaction history with categories
- `BankTransfer` — transfer records with status tracking

### Socket Events
- `bank:update`, `bank:transfer`, `bank:transaction`
- `bank:card:update`, `bank:balance`, `bank:fraud:alert`
- `bank:initialized`, `bank:payment:completed`

### API Endpoints
```
POST   /api/bank/initialize
GET    /api/bank/dashboard
GET    /api/bank/accounts
GET    /api/bank/accounts/:id
GET    /api/bank/cards
POST   /api/bank/cards/:id/freeze
POST   /api/bank/cards/:id/unfreeze
GET    /api/bank/transactions
GET    /api/bank/transfers
POST   /api/bank/transfers/internal
POST   /api/bank/transfers/external
POST   /api/bank/payments/qr
GET    /api/bank/budget
GET    /api/bank/analytics
```

## Identity (`com.gulfos.identity`)

Official digital identity for citizens.

### Features
- Citizen profile with national ID, verification status
- Government documents (passport, driving license, ownership records)
- Emergency medical information
- QR/barcode/NFC verification
- vCard export
- Identity-gated app access (Bank, SIM, Police)

### Models
- `CitizenIdentity` — core identity profile
- `IdentityDocument` — linked government documents

### Socket Events
- `identity:update`, `identity:verified`
- `identity:document:added`, `identity:verification:completed`
- `identity:initialized`, `identity:revoked`

### API Endpoints
```
POST   /api/identity/initialize
GET    /api/identity/profile
PATCH  /api/identity/profile
GET    /api/identity/documents
POST   /api/identity/documents
GET    /api/identity/emergency
PATCH  /api/identity/emergency
POST   /api/identity/qr/generate
POST   /api/identity/qr/verify
POST   /api/identity/barcode/verify
GET    /api/identity/export/vcard
GET    /api/identity/search
```

## Integration

Both apps initialize on system boot via `initializeSystemServices()`.

Permissions granted: `bank`, `identity`, `biometrics`, `notifications`.

Global Search indexes bank accounts and identity documents.

Widget Engine provides bank balance widget with realtime data.

## Frontend

- `apps/web/src/apps/bank/` — 7-tab banking UI
- `apps/web/src/apps/identity/` — 4-tab identity UI
- TanStack Query hooks: `useBank.ts`, `useIdentity.ts`
- Realtime sync via socket events in `OSProvider`
