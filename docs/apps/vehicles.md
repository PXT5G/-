# GULF Auto Marketplace (`com.gulfos.vehicles`)

Phase 4.4 — The official vehicle marketplace and dealership platform for GULFOS. Integrates with GULF Business, GULF Bank, GULF Real Estate, Government, Police, Justice, Identity, World Engine, Maps, and Communication Core.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.vehicles` |
| API Base | `/api/vehicles` |
| Category | Utilities |
| Premium | Yes |

## Features

### Vehicle Management
- 24+ vehicle categories (sedan, SUV, supercar, police, military, custom, etc.)
- Full vehicle details: VIN, plate, brand, model, specs, mileage, condition
- Images, videos, documents, insurance, registration, inspection, warranty
- GPS location, mods, repair history, owner and business owner tracking

### Buy / Sell
- Cash, installments, bank financing, leasing, trade-in
- Offers, counter-offers, negotiation
- Dealer pricing, taxes (8% sale, 3% lease)
- Automatic ownership transfer and bank transfers via GULF Business

### Dealership
- Authorized dealerships linked to GULF Business companies
- Create/import inventory, reserve vehicles, auctions
- Employee management, profit/expense tracking, IBAN bank transfers
- Payroll and commission support via business integration

### Business Integration
- Inventory syncs to `CompanyAsset` (category: vehicle)
- Sales recorded as `CompanyRevenue`
- Expenses recorded as `CompanyExpense`
- Vehicle value contributes to company asset valuation

### Analytics
- Revenue, expenses, profit, inventory value
- Best sellers, sales history, commission, taxes
- Per-dealer and portfolio-level analytics

## MongoDB Models

`Vehicle`, `VehicleDealer`, `VehicleInventory`, `VehicleSale`, `VehicleFinance`, `VehicleLease`, `VehicleInsurance`, `VehicleWarranty`, `VehicleInspection`, `VehicleMaintenance`, `VehicleAuction`, `VehicleOffer`, `VehicleAnalytics`, `VehicleAuditLog`, `VehicleRole`

## API Endpoints

- `POST /initialize`, `GET /dashboard`, `GET /analytics`, `GET /audit`
- `GET/POST /vehicles`, `PATCH /vehicles/:id`
- `POST /vehicles/:id/list|reserve|favorite`
- `POST /search` — advanced search (brand, model, price, VIN, plate, dealer)
- `GET/POST /dealers`, `GET /dealers/:id/inventory`
- `GET/POST /offers`, `POST /offers/:id/accept|counter`
- `GET /sales`, `GET/POST /finance`
- `GET/POST /auctions`, `POST /auctions/:id/bid`
- `POST /maintenance`, `GET /favorites`, `GET /rbac`, `PATCH /rbac`

## Realtime Events

`vehicles:listed`, `vehicles:sold`, `vehicles:reserved`, `vehicles:auction`, `vehicles:inventory:update`, `vehicles:price:change`, `vehicles:offer:received`, `vehicles:offer:accepted`, and 4 more.

## Ecosystem Integration

| Service | Integration |
|---------|-------------|
| GULF Business | Company assets, revenue, expenses, bank transfers, IBAN |
| GULF Bank | Financing, installments, escrow transfers |
| Police/Justice | Extended plate/VIN search with marketplace records |
| World Engine | GPS location on vehicle listings |
| Identity | Owner and buyer lookup |
| Notification Broker | Offer, sale, auction notifications |

## Frontend

Premium GULFOS UI with tabs: Home, Browse, Dealers, Inventory, Finance, Auctions, Analytics, Favorites, Messages, More.

Registered at `apps/web/src/apps/vehicles/` with Zustand store, React Query hooks, and realtime socket sync.
