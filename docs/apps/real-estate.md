# GULF Real Estate Platform (`com.gulfos.real-estate`)

Phase 4.3 — The official real estate management platform for GULFOS. Integrates with GULF Business, GULF Bank, Government, Justice, Police, Identity, World Engine, Maps, and Communication Core.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.real-estate` |
| API Base | `/api/real-estate` |
| Category | Utilities |
| Premium | Yes |

## Features

### Property Management
- 30+ property categories (apartments, villas, marinas, government buildings, land, etc.)
- Full property details: size, rooms, amenities, utilities, GPS coordinates
- Images, videos, floor plans, documents, virtual tours
- Private, business, government, shared, company, investment, fractional ownership

### Buy / Sell
- Offers, counter-offers, negotiation history
- Escrow, contracts, ownership transfer
- Automatic bank transfers via GULF Business banking
- Automatic tax collection (5% sale tax)

### Rentals
- Monthly, weekly, daily rent pricing
- Lease contracts, security deposits
- Automatic rent collection with tax (2%)
- Tenant ratings, rental history, eviction support

### Business Integration
- Company-owned properties auto-sync to `CompanyAsset`
- Property income recorded as `CompanyRevenue`
- Property expenses recorded as `CompanyExpense`
- Property value affects company total assets (future stock valuation)

### Analytics
- Market value, rental income, ROI, occupancy rate
- Capital gain, appreciation, profit/loss
- Per-property and portfolio-level analytics

### Admin Panel
- Dealer listing creation, approval, featuring, archiving
- Price and availability management
- Image and floor plan uploads

## MongoDB Models

`Property`, `PropertyOwner`, `PropertyImage`, `PropertyVideo`, `PropertyFloorPlan`, `PropertyDocument`, `PropertyOffer`, `PropertySale`, `PropertyRental`, `PropertyLease`, `PropertyTenant`, `PropertyMaintenance`, `PropertyInspection`, `PropertyInsurance`, `PropertyAnalytics`, `PropertyAuditLog`, `PropertyRole`

## API Endpoints

- `POST /initialize`, `GET /dashboard`, `GET /analytics`
- `GET/POST /properties`, `PATCH /properties/:id`
- `POST /properties/:id/approve|feature|archive|images|floor-plans|favorite`
- `POST /search` — advanced search with GPS radius
- `GET/POST /offers`, `POST /offers/:id/counter|accept`
- `GET /sales`, `GET/POST /leases`, `POST /leases/:id/collect`
- `GET/POST /maintenance`, `POST /inspections`
- `GET /favorites`, `GET /rbac`, `PATCH /rbac`

## Realtime Events

`realestate:listing:created`, `realestate:property:sold`, `realestate:offer:received`, `realestate:price:change`, and 10 more.

## Ecosystem Integration

| Service | Integration |
|---------|-------------|
| GULF Business | Company assets, revenue, expenses, bank transfers |
| GULF Bank | IBAN transfers for sales and rent |
| Police/Justice | Extended `searchProperty` with real property records |
| World Engine | GPS location on dashboard |
| Identity | Owner and tenant lookup |
| Notification Broker | Offer and sale notifications |

## Frontend

`apps/web/src/apps/real-estate/` — Glassmorphism UI with tabs: Home, Search, Properties, Rentals, Sales, Analytics, Favorites, Messages, More.
