# GULF Exchange (`com.gulfos.exchange`)

Phase 4.8 — The official stock exchange and investment platform for GULFOS. All stock prices are derived from the Economy Engine — the Exchange never calculates company valuation internally.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.exchange` |
| Exchange ID | `GULFX` |
| API Base | `/api/exchange` |
| Currency | GULF |
| Category | Finance |

## Architecture Principle

```
Economy Engine → CompanyValuation → Exchange Price Engine → Stock.currentPrice
```

The Exchange **consumes** `CompanyValuation.totalValuation` and derives share price as:

`sharePrice = totalValuation / outstandingShares × (1 + orderBookImpact + demandImpact + confidenceImpact + eventImpact)`

No random price generation. All adjustments are deterministic from economy data, order book, and market factors.

## Features

### Listed Companies
17+ company types: public, private, government, bank, real estate, vehicle dealership, airline, marine, technology, healthcare, media, custom, etc.

### IPO Workflow
Apply → Government review → Approval → Share creation → Listing → Lockup periods → IPO history

### Trading
- Market, limit, stop, stop-limit orders
- Buy/sell with partial fills
- Order matching engine
- 0.1% trading fee
- GULF Bank portfolio integration (IBAN, wallet, cash balance)

### Portfolio
Cash balance, holdings, unrealized/realized profit, dividend income, watchlist, investment history

### Market Indexes
GULF 20, GULF Business Index, Property Index, Auto Index, Aviation Index, Marine Index

### Dividends
Quarterly, special, annual — automatic portfolio deposits

### Corporate Actions
Stock split, reverse split, trading halt, merger, acquisition, delisting, buyback, new share issue

### Anti-Fraud
Insider trading risk, wash trading, large transaction alerts, order spam detection

### News
Market, company, government, IPO, dividend, economic reports — affects market confidence

## MongoDB Models

`Exchange`, `ListedCompany`, `IPO`, `Stock`, `StockPrice`, `StockHistory`, `MarketIndex`, `Portfolio`, `PortfolioHolding`, `Order`, `Trade`, `Dividend`, `CorporateAction`, `Watchlist`, `ExchangeNews`, `MarketEvent`, `ExchangeAuditLog`, `ExchangeRole`

## API Endpoints

- `POST /initialize`, `GET /dashboard`, `GET /analytics`, `GET /audit`, `POST /tick`
- `GET /stocks`, `GET /stocks/:id`, `GET /search`
- `GET /portfolio`, `GET/POST /orders`, `DELETE /orders/:id`, `GET /trades`
- `GET /indexes`, `GET /news`, `GET/PUT /watchlist`
- `GET/POST /ipos`, `POST /ipos/:id/review`, `POST /dividends`

## Realtime Events

`exchange:update`, `stock:update`, `trade:update`, `portfolio:update`, `order:update`, `dividend:update`, `market:update`, `news:update`

## Ecosystem Integration

| System | Integration |
|--------|-------------|
| Economy Engine | Company valuations, demand, confidence, events |
| GULF Business | Company metrics sync (revenue, assets, fleet) |
| GULF Bank | Portfolio IBAN, wallet, transaction history |
| Real Estate / Auto / Aviation / Marine | Asset values in economy valuations |
| Government | IPO review and approval |
| Police / Identity | Fraud detection, user lookup |
| Notification Broker | Trade, dividend, IPO notifications |

## Seed Data

On first initialize:
- 15 listed companies with economy-linked opening prices
- 5 market indexes
- ~150 historical trades
- ~60 news articles

Grows naturally from gameplay thereafter.

## Frontend

Premium GULFOS UI with tabs: Home, Markets, Stocks, Portfolio, Orders, News, Watchlist, Analytics, More.

Charts: line, area (volume bars), candlestick — all from real `StockHistory` data.

## Background Jobs

Runs after Economy Engine hourly tick: updates all stock prices, processes pending orders, recalculates indexes.
