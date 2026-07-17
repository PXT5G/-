# GULF Marine Marketplace (`com.gulfos.marine`)

Phase 4.6 — The official marine marketplace and fleet management platform for GULFOS. Integrates with GULF Business, GULF Bank, GULF Real Estate, Government, Police, Justice, EMS, Identity, World Engine, Maps, and Communication Core.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.marine` |
| API Base | `/api/marine` |
| Category | Utilities |
| Premium | Yes |

## Features

### Vessel Management
- 19+ vessel categories (yachts, cargo ships, ferries, submarines, military, custom, etc.)
- Full vessel details: registration, hull number, manufacturer, model, engine hours, specs
- Images, videos, documents, insurance, inspection, maintenance/repair history
- GPS location, current marina, dock, port, owner and business owner tracking

### Buy / Sell
- Cash, installments, bank financing, leasing, trade-in
- Offers, counter-offers, negotiation
- Dealer pricing, taxes (9% sale, 3.5% lease)
- Automatic ownership transfer and bank transfers via GULF Business

### Marinas & Infrastructure
- Marinas, private/public docks, ports, harbors, shipyards, boat storage
- Fuel stations and maintenance facilities
- Vessel movement between marinas, docks, and ports

### Dealership / Marine Companies
- Authorized marine companies linked to GULF Business
- Import/sell/lease/auction vessels, reserve inventory
- Captain and mechanic management, employee tracking
- Financial reports: revenue, expenses, fleet value, maintenance/fuel/insurance costs

### Business Integration
- Vessels sync to `CompanyAsset` (category: vessel)
- Sales recorded as `CompanyRevenue`
- Expenses recorded as `CompanyExpense`
- Fleet value contributes to company asset valuation

## MongoDB Models

`Vessel`, `MarineDealer`, `MarineInventory`, `MarineSale`, `MarineFinance`, `MarineLease`, `MarineInsurance`, `MarineInspection`, `MarineMaintenance`, `Marina`, `Dock`, `Port`, `MarineAuction`, `MarineOffer`, `MarineAnalytics`, `MarineAuditLog`, `MarineRole`

## API Endpoints

- `POST /initialize`, `GET /dashboard`, `GET /analytics`, `GET /audit`
- `GET/POST /vessels`, `PATCH /vessels/:id`
- `POST /vessels/:id/list|reserve|move|favorite`
- `POST /search` — advanced search (manufacturer, model, registration, marina, port)
- `GET/POST /dealers`, `GET /dealers/:id/fleet`
- `GET/POST /marinas`, `GET /marinas/:id`, `POST /docks`, `POST /ports`
- `GET/POST /offers`, `POST /offers/:id/accept|counter`
- `GET /sales`, `GET/POST /finance`, `GET/POST /leases`
- `GET/POST /auctions`, `POST /auctions/:id/bid`
- `POST /maintenance`, `GET /favorites`, `GET /rbac`, `PATCH /rbac`

## Realtime Events

`marine:listed`, `marine:sold`, `marine:reserved`, `marine:leased`, `marine:auction:started`, `marine:auction:ended`, `marine:maintenance`, `marine:location:change`, `marine:price:change`, and 6 more.

## Ecosystem Integration

| Service | Integration |
|---------|-------------|
| GULF Business | Company assets, revenue, expenses, bank transfers, IBAN |
| GULF Bank | Financing, installments, escrow transfers |
| Police/Justice | Extended vehicle/aircraft/vessel search with registration lookup |
| World Engine | GPS location on vessels and marinas |
| Identity | Owner and captain lookup |
| Notification Broker | Offer, sale, auction, maintenance notifications |

## Frontend

Premium GULFOS UI with tabs: Home, Browse, Marinas, Fleet, Finance, Auctions, Analytics, Favorites, Messages, More.

Registered at `apps/web/src/apps/marine/` with Zustand store, React Query hooks, and realtime socket sync.
