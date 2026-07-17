# GULF Business Platform (`com.gulfos.business`)

Phase 4.2 — The economic foundation of GULFOS. Enterprise business management for company registration, banking, employees, finance, inventory, analytics, customers, suppliers, and government integration.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.business` |
| API Base | `/api/business` |
| Category | Utilities |
| Premium | Yes |

## Features

### Company Registration
- Full company profile: name, trade name, license, commercial registration, tax number
- Owner, partners, shareholders
- Headquarters with geo coordinates
- Logo, banner, description, website, contact info
- Automatic status workflow: pending → active → suspended/closed

### Banking (GULF Bank Integration)
Every company automatically receives:
- Company IBAN (`GULF*` format)
- Company Wallet ID
- Bank Account Number
- Cash / Available / Frozen balances
- Payroll, Tax, and Loan sub-accounts
- Full transaction history
- Deposit, withdraw, transfer, freeze operations

### Employee System
- Departments and job titles with ranks
- Hire, terminate, promote, demote, suspend
- Attendance (check-in/check-out)
- Salary, bonus, commission
- Performance scores and warnings
- Activity logs with IP and device UUID

### Financial System
Auto-calculated metrics:
- Revenue, expenses, net profit, operating cost
- Payroll totals, assets, inventory value
- Loans, debt, cash flow
- Monthly and yearly income
- Financial statements and reports

### Inventory
- Products with SKU, stock quantity, warehouse
- Serial numbers, purchase/selling price
- Supplier links, transfers, damage reports
- Automatic inventory valuation

### Analytics Dashboard
- Daily, weekly, monthly, yearly revenue
- Profit, loss, growth metrics
- Top products and employees
- Sales and financial charts
- Performance reports

### Customers & Suppliers
- Customer profiles with purchase history, loyalty, reviews
- Blacklist support
- Supplier contracts, outstanding payments

### Government Integration
- Business license renewal
- Inspections (schedule/complete)
- Violations and fines
- Government contracts
- Business suspension

### Security
- RBAC with 13 roles and 60+ permissions
- Audit logs (platform + company-level)
- Digital signatures
- Permission Broker integration
- Notification Broker integration
- IP and device UUID logging

## MongoDB Models

| Model | Purpose |
|-------|---------|
| `Company` | Core entity with banking and financial summary |
| `CompanyBranch` | Branch locations |
| `CompanyDepartment` | Organizational departments |
| `CompanyEmployee` | Employee records |
| `CompanyRole` | Role permission configs |
| `CompanyPermission` | Custom permission grants |
| `CompanyRevenue` | Revenue entries |
| `CompanyExpense` | Expense entries |
| `CompanyPayroll` | Payroll records |
| `CompanyAsset` | Company assets |
| `CompanyInventory` | Product inventory |
| `CompanyWarehouse` | Warehouse locations |
| `CompanySupplier` | Supplier profiles |
| `CompanyCustomer` | Customer profiles |
| `CompanyInvoice` | Invoices |
| `CompanyLoan` | Loan records |
| `CompanyTax` | Tax filings |
| `CompanyContract` | Contracts |
| `CompanyAnalytics` | Analytics snapshots |
| `CompanyAuditLog` | Company audit trail |

## API Endpoints

### Core
- `POST /initialize` — Initialize business platform
- `GET /categories` — List business categories
- `GET /companies` — List user's companies
- `POST /companies` — Register new company
- `GET /companies/:id` — Get company details
- `PATCH /companies/:id` — Update company
- `GET /dashboard?companyId=` — Dashboard data

### Operations
- `GET/POST /branches`, `/departments`
- `GET /employees`, `POST /employees/hire`, `POST /employees/:id/terminate`, `POST /employees/:id/promote`
- `POST /employees/attendance`
- `GET/POST /revenue`, `GET/POST /expenses`, `POST /expenses/:id/approve`
- `GET /payroll`, `POST /payroll/process`
- `GET/POST /inventory`, `POST /inventory/:id/transfer`
- `GET /warehouses`
- `GET/POST /customers`, `POST /customers/:id/blacklist`
- `GET/POST /suppliers`
- `GET/POST /invoices`, `POST /invoices/:id/pay`
- `GET /taxes`, `POST /taxes/file`, `POST /taxes/:id/pay`
- `GET/POST /loans`
- `GET/POST /contracts`, `GET/POST /assets`

### Banking
- `GET /bank?companyId=`
- `POST /bank/deposit`, `/bank/withdraw`, `/bank/transfer`, `/bank/freeze`

### Government
- `POST /government/renew`, `/government/inspect`, `/government/violation`, `/government/suspend`

### Analytics & Admin
- `GET /analytics`, `/reports`, `/audit`
- `GET/PATCH /settings`
- `GET/PATCH /rbac`
- `POST /search`

## Realtime Events

```
business:initialized
business:company:update
business:revenue:update
business:expense:update
business:payroll:update
business:inventory:update
business:employee:update
business:report:ready
business:notification
business:bank:transaction
business:status:change
business:analytics:update
business:invoice:update
business:contract:update
business:government:alert
```

## Ecosystem Integration

| Service | Integration |
|---------|-------------|
| GULF Bank | Company IBAN, wallet, accounts, transactions |
| Identity | User lookup for hiring and customers |
| Phone | Contact search |
| Contacts | Communication allowlist |
| Communication Core | Business conversation type |
| World Engine | Location for dashboard |
| Device Ecosystem | Device UUID logging |
| Notification Broker | Business notifications |
| Permission Broker | App install and permission checks |
| Browser | business-hub portal at business.gulfos.com |

## Frontend

Located at `apps/web/src/apps/business/`:
- Glassmorphism UI with Framer Motion
- TanStack Query for data fetching
- Zustand store (`businessStore.ts`) for company/tab state
- Responsive mobile tab navigation
- Screens: Dashboard, Analytics, Employees, Inventory, Finance, Customers, Suppliers, Reports, Branches, Settings

## Future Dependencies

This platform is designed as the foundation for:
- GULF Exchange (Stock Market)
- GULF Real Estate
- GULF Auto / Aviation / Marine Marketplaces
- Government, Justice, Police, Bank, Taxes, Insurance
- News and Economy Engine
