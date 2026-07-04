# Banana Bank — Premium Digital Banking

> Phase 3 — App 03 (Complete)  
> Bundle ID: `com.bananaos.bank`

## Overview

Banana Bank is the official financial system of BananaOS. Every verified Identity account automatically receives secure bank accounts with a welcome bonus. The app provides premium glassmorphism UI, realtime balance updates, transfers, QR payments, analytics, and full audit logging.

## Features

| Feature | Status |
|---------|--------|
| Animated Dashboard | ✅ |
| Multiple Account Types | ✅ |
| Virtual Debit & Premium Cards | ✅ |
| Card Freeze/Unfreeze | ✅ |
| Money Transfers | ✅ |
| QR Payment (Generate/Scan) | ✅ |
| Deposits & Withdrawals | ✅ |
| Bills & Payments | ✅ |
| Transaction History & Search | ✅ |
| Export CSV & PDF Statement | ✅ |
| Analytics & Budget Tracking | ✅ |
| Security Center | ✅ |
| Fraud Detection | ✅ |
| Realtime Updates | ✅ |
| Admin Panel | ✅ |
| Identity Integration | ✅ |

## Architecture

```
apps/web/src/apps/bank/
├── index.tsx
├── manifest.ts
├── types.ts
├── store/bankStore.ts
├── services/bankService.ts
├── hooks/useBankRealtime.ts
├── components/
│   ├── BankTabBar.tsx
│   ├── AnimatedBalance.tsx
│   ├── BankCardVisual.tsx
│   └── TransactionItem.tsx
└── screens/
    ├── DashboardScreen.tsx
    ├── AccountsScreen.tsx
    ├── CardsScreen.tsx
    ├── TransferScreen.tsx
    ├── HistoryScreen.tsx
    ├── AnalyticsScreen.tsx
    ├── PaymentsScreen.tsx
    ├── SecurityScreen.tsx
    ├── NotificationsScreen.tsx
    └── AdminScreen.tsx

apps/api/src/
├── database/models/
│   ├── BankAccount.ts
│   ├── BankCard.ts
│   ├── Transaction.ts
│   ├── Transfer.ts
│   ├── Deposit.ts
│   ├── Withdrawal.ts
│   ├── Payment.ts
│   ├── ScheduledTransfer.ts
│   ├── Statement.ts
│   ├── Budget.ts
│   ├── BankAuditLog.ts
│   └── BankSecuritySettings.ts
├── services/bankService.ts
├── api/controllers/
│   ├── bankController.ts
│   └── bankAdminController.ts
└── api/routes/bank.ts
```

## Database Schema

| Model | Purpose |
|-------|---------|
| `BankAccount` | Current, savings, business, wallet accounts |
| `BankCard` | Virtual debit, credit, premium black cards |
| `Transaction` | All financial movements with audit trail |
| `Transfer` | Inter-account and peer transfers |
| `Deposit` | Cash, manual, admin deposits |
| `Withdrawal` | Fund withdrawals with receipts |
| `Payment` | Bills, subscriptions, store, invoices |
| `ScheduledTransfer` | Recurring/scheduled transfers |
| `Statement` | Generated account statements |
| `Budget` | Category budget tracking |
| `BankAuditLog` | Every financial action logged |
| `BankSecuritySettings` | PIN, limits, 2FA, notifications |

### Account Formats

- **Account Number:** `BNK-NNNNNNNN`
- **IBAN:** `BR12BANA` + 16 digits
- **Transaction Ref:** `TXN-{timestamp}-{random}`
- **Transfer Ref:** `TRF-{timestamp}-{random}`

## API Endpoints

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bank/provision` | Create bank accounts (requires verified identity) |
| GET | `/api/bank/dashboard` | Dashboard with balance, stats, activity |
| GET | `/api/bank/accounts` | List accounts |
| GET | `/api/bank/balance` | Total balance |
| POST | `/api/bank/transfer` | Send money |
| POST | `/api/bank/deposit` | Deposit funds |
| POST | `/api/bank/withdraw` | Withdraw funds |
| POST | `/api/bank/payments` | Make payment |
| POST | `/api/bank/qr/generate` | Generate payment QR |
| POST | `/api/bank/qr/scan` | Scan and pay via QR |
| GET | `/api/bank/transactions` | Transaction history with filters |
| GET | `/api/bank/export/csv` | Export transactions CSV |
| GET | `/api/bank/export/statement` | Download PDF statement |
| GET | `/api/bank/analytics` | Income/expense analytics |
| GET | `/api/bank/cards` | List cards |
| POST | `/api/bank/cards/:id/freeze` | Freeze card |
| GET | `/api/bank/security` | Security settings |
| GET | `/api/bank/notifications` | Bank notifications |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bank/admin/transfers/pending` | Pending approval queue |
| POST | `/api/bank/admin/transfers/:id/approve` | Approve flagged transfer |
| POST | `/api/bank/admin/transfers/:id/reject` | Reject transfer |
| POST | `/api/bank/admin/accounts/:id/freeze` | Freeze account |
| POST | `/api/bank/admin/deposit` | Admin deposit |
| GET | `/api/bank/admin/stats` | Financial statistics |
| GET | `/api/bank/admin/audit` | Audit logs |

## Permissions & Integration

### Identity (Required)
- Verified identity required to provision accounts
- Uses `identityService.getMe()` on frontend
- Identity API available for Police/Justice via `identityApi` with permissions

### Connected Systems
| System | Integration |
|--------|-------------|
| Identity | Account provisioning tied to verified identity |
| Notifications | `Notification` model with `appId: com.bananaos.bank` |
| Realtime | Socket events: `bank:balance:updated`, `bank:transfer:complete` |
| SMS/Phone | Future — payment confirmations |
| Police | Read-only via identity permissions |
| Justice | Authorized access via identity permissions |

## Flows

### Account Opening
1. User must have verified Identity
2. Open Banana Bank → auto-provision or tap "Open Account"
3. Creates: Current (1000 BNA welcome bonus), Savings, Wallet, Business
4. Issues virtual debit + premium black card

### Transfer
1. Select source account → enter recipient account number
2. Fraud detection flags large/rapid transfers for admin approval
3. Debit + credit transactions created atomically
4. Both parties notified, audit logged

### QR Payment
1. Generate QR with optional fixed amount
2. Payer scans QR payload → transfer executed
3. HMAC signature validates payment authenticity

## Socket Events

```
bank:balance:updated
bank:transfer:complete
bank:notification
bank:accounts:provisioned
```

## Tests

```bash
npm run test --workspace=@bananaos/web
```

## Future Roadmap

- Apple/Google Wallet card provisioning
- International wire transfers
- Investment portfolios
- Loan and credit products
- Merchant POS integration
- Open Banking API for third parties
