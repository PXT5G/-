# GULF Aviation Marketplace (`com.gulfos.aviation`)

Phase 4.5 — The official aviation marketplace and fleet management platform for GULFOS. Integrates with GULF Business, GULF Bank, GULF Real Estate, Government, Police, Justice, EMS, Identity, World Engine, Maps, and Communication Core.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.aviation` |
| API Base | `/api/aviation` |
| Category | Utilities |
| Premium | Yes |

## Features

### Aircraft Management
- 19+ aircraft categories (private jets, helicopters, cargo planes, drones, military, VIP, custom, etc.)
- Full aircraft details: registration, serial, manufacturer, model, flight hours, specs
- Images, videos, documents, insurance, inspection, maintenance/repair history
- GPS location, current airport, current hangar, owner and business owner tracking

### Buy / Sell
- Cash, installments, bank financing, leasing, trade-in
- Offers, counter-offers, negotiation
- Dealer pricing, taxes (10% sale, 4% lease)
- Automatic ownership transfer and bank transfers via GULF Business

### Airports & Infrastructure
- Airports, private/government/military hangars, helipads, military bases
- Runways with surface types, fuel stations, maintenance facilities
- Aircraft movement between airports and hangars

### Dealership / Aviation Companies
- Authorized aviation companies linked to GULF Business
- Import/sell/lease/auction aircraft, reserve inventory
- Pilot and mechanic management, employee tracking
- Financial reports: revenue, expenses, fleet value, maintenance/fuel/insurance costs

### Business Integration
- Aircraft sync to `CompanyAsset` (category: aircraft)
- Sales recorded as `CompanyRevenue`
- Expenses recorded as `CompanyExpense`
- Fleet value contributes to company asset valuation

## MongoDB Models

`Aircraft`, `AircraftDealer`, `AircraftInventory`, `AircraftSale`, `AircraftFinance`, `AircraftLease`, `AircraftInsurance`, `AircraftInspection`, `AircraftMaintenance`, `AircraftHangar`, `Airport`, `Runway`, `AircraftAuction`, `AircraftOffer`, `AircraftAnalytics`, `AircraftAuditLog`, `AircraftRole`

## API Endpoints

- `POST /initialize`, `GET /dashboard`, `GET /analytics`, `GET /audit`
- `GET/POST /aircraft`, `PATCH /aircraft/:id`
- `POST /aircraft/:id/list|reserve|move|favorite`
- `POST /search` — advanced search (manufacturer, model, registration, airport, hangar)
- `GET/POST /dealers`, `GET /dealers/:id/fleet`
- `GET/POST /airports`, `GET /airports/:id`, `POST /hangars`, `POST /runways`
- `GET/POST /offers`, `POST /offers/:id/accept|counter`
- `GET /sales`, `GET/POST /finance`, `GET/POST /leases`
- `GET/POST /auctions`, `POST /auctions/:id/bid`
- `POST /maintenance`, `GET /favorites`, `GET /rbac`, `PATCH /rbac`

## Realtime Events

`aviation:listed`, `aviation:sold`, `aviation:reserved`, `aviation:leased`, `aviation:auction`, `aviation:maintenance`, `aviation:moved`, `aviation:price:change`, and 6 more.

## Ecosystem Integration

| Service | Integration |
|---------|-------------|
| GULF Business | Company assets, revenue, expenses, bank transfers, IBAN |
| GULF Bank | Financing, installments, escrow transfers |
| Police/Justice | Extended vehicle/aircraft search with registration lookup |
| World Engine | GPS location on aircraft and airports |
| Identity | Owner and pilot lookup |
| Notification Broker | Offer, sale, auction, maintenance notifications |

## Frontend

Premium GULFOS UI with tabs: Home, Browse, Airports, Fleet, Finance, Auctions, Analytics, Favorites, Messages, More.

Registered at `apps/web/src/apps/aviation/` with Zustand store, React Query hooks, and realtime socket sync.
