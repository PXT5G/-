# GULF Economy Engine (`com.gulfos.economy-engine`)

Phase 4.7 — The central economic simulation for GULFOS. This is **not** a public application. It is the single source of truth for macroeconomic data and will power the future GULF Exchange stock market.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.economy-engine` |
| API Base | `/api/economy` |
| Access | Admin only (`requireAdmin`) |
| Tick Interval | Hourly (background job) |

## Responsibilities

- **Money flow** — tracks GDP, consumer spending, liquidity, money supply
- **Inflation / deflation** — price index from sector demand/supply ratios
- **Market demand & supply** — per-sector indices updated hourly
- **Company valuation** — DCF-style from cash, bank, revenue, assets, fleet, debt, rating
- **Asset valuation** — automatic `marketValue` updates for properties, vehicles, aircraft, vessels
- **Bank integration** — loans, mortgages, financing, defaults aggregation
- **Economic events** — government decisions, disasters, market shocks
- **Economic reports** — hourly snapshots with highlights

## Company Valuation Formula

Every company valuation calculates from:

| Input | Source |
|-------|--------|
| Cash | `Company.cashBalance` |
| Bank Balance | All company sub-accounts |
| Revenue / Expenses / Profit | `Company` aggregates |
| Employees / Customers | `Company.employeeCount`, `customerCount` |
| Assets | `CompanyAsset.currentValue` by category |
| Vehicles / Aircraft / Marine / Properties | Asset category breakdown |
| Loans / Debt / Taxes | `CompanyLoan`, `CompanyTax` |
| Inventory | `Company.inventoryValue` × 0.85 |
| Business Rating | Average customer review ratings |

Valuation = `(cash + bank + assets + inventory + annualizedProfit×8 + employee×2500 + customer×150 - debt - loans - taxes×0.5) × ratingMultiplier × confidenceMultiplier × inflationAdj`

## Market Demand Factors

Demand index per sector adjusts from:

- Population (user count)
- Recent sales (last hour)
- Supply (inverse of listing count)
- Active economic events
- Government contracts / fines
- Weather (World Engine)
- Base interest rate

## MongoDB Models

`EconomyState`, `EconomicReport`, `CompanyValuation`, `MarketDemand`, `MarketSupply`, `AssetValuation`, `InflationHistory`, `GDPHistory`, `EconomicEvent`, `EconomyAuditLog`, `EconomyRole`

## API Endpoints (Admin Only)

- `POST /initialize`, `POST /tick` — init and manual tick
- `GET /dashboard`, `GET /state`, `GET /analytics`
- `GET /reports`, `GET /gdp`, `GET /inflation`
- `GET /valuations`, `GET /valuations/:companyId`
- `GET /demand`, `GET /supply`, `GET /assets`
- `GET /bank`, `GET /events`, `POST /events`
- `GET /audit`, `GET /rbac`

## Realtime Events

`economy:update`, `market:update`, `valuation:update`, `inflation:update`, `gdp:update`

Plus per-marketplace price events when asset values change.

## Ecosystem Integration

| System | Integration |
|--------|-------------|
| GULF Business | Company financials, assets, loans, taxes, revenue |
| GULF Bank | Loan/financing/default metrics via business + marketplace finance |
| Real Estate / Auto / Aviation / Marine | Sales volume, listing supply, `marketValue` updates |
| World Engine | Weather impact on demand |
| Government | Contract counts, fines |
| Identity | Population count |
| Notification Broker | Economy admin notifications |

## Frontend

Internal admin dashboard in **Settings → Economy Engine** (admin role only). Shows GDP charts, inflation, market heatmap, company rankings, bank metrics.

## Background Jobs

Registered in `backgroundServiceManager` as `economy-tick` (60 min). Runs `tickEconomy('system')` which:

1. Aggregates bank metrics
2. Calculates demand/supply per sector
3. Computes inflation and GDP
4. Updates market prices
5. Recalculates all company valuations
6. Generates hourly economic report
7. Broadcasts socket events

## Future: GULF Exchange

Company valuations and sector indices are designed as the foundation for stock market pricing. `CompanyValuation.totalValuation` and `rank` feed future exchange listings.
