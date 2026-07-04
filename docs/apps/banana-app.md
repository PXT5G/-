# Banana App — Application Marketplace

> Phase 3 — App 01 (Complete)  
> Bundle ID: `com.bananaos.store`

## Overview

Banana App is the premium application marketplace for BananaOS. Users can browse, search, install, update, and manage applications with realtime download progress and beautiful installation animations.

## Features

| Feature | Status |
|---------|--------|
| Featured Apps | ✅ |
| Categories | ✅ |
| Search | ✅ |
| Trending | ✅ |
| Recommended | ✅ |
| Editor's Choice | ✅ |
| Official Verified Apps | ✅ |
| Developer Profiles | ✅ |
| Screenshots | ✅ |
| Ratings & Reviews | ✅ |
| Install / Uninstall / Update | ✅ |
| Auto Update Setting | ✅ |
| Permissions Display | ✅ |
| Storage Usage | ✅ |
| Download Progress (Realtime) | ✅ |
| Version History | ✅ |
| Premium App Badges | ✅ |
| Recently Installed | ✅ |
| Installation Animation | ✅ |
| Update Animation | ✅ |

## Architecture

```
apps/web/src/apps/banana-app/
├── index.tsx                 # Root component + navigation
├── manifest.ts               # App manifest
├── types.ts                  # TypeScript interfaces
├── store/bananaAppStore.ts   # Zustand state
├── services/bananaAppService.ts
├── hooks/useStoreRealtime.ts
├── components/
│   ├── AppCard.tsx
│   ├── InstallOverlay.tsx
│   └── StoreTabBar.tsx
└── screens/
    ├── TodayScreen.tsx
    ├── AppsScreen.tsx
    ├── SearchScreen.tsx
    ├── UpdatesScreen.tsx
    ├── LibraryScreen.tsx
    ├── AppDetailScreen.tsx
    └── DeveloperScreen.tsx

apps/api/src/
├── database/models/
│   ├── Developer.ts
│   ├── StoreListing.ts
│   ├── StoreReview.ts
│   ├── AppVersion.ts
│   ├── StoreDownload.ts
│   └── UserStoreSettings.ts
├── api/controllers/storeController.ts
├── api/routes/store.ts
└── services/
    ├── downloadService.ts
    └── storeSeedService.ts
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/store/featured` | Optional | Featured apps |
| GET | `/api/store/trending` | Optional | Trending apps |
| GET | `/api/store/recommended` | Optional | Recommended apps |
| GET | `/api/store/editors-choice` | Optional | Editor's choice |
| GET | `/api/store/categories` | Public | Category list |
| GET | `/api/store/categories/:id` | Optional | Apps by category |
| GET | `/api/store/search?q=` | Optional | Search apps |
| GET | `/api/store/apps/:bundleId` | Optional | App detail |
| GET | `/api/store/apps/:bundleId/reviews` | Public | Reviews |
| POST | `/api/store/apps/:bundleId/reviews` | Required | Post review |
| POST | `/api/store/apps/:bundleId/install` | Required | Start install |
| POST | `/api/store/downloads/:id/complete` | Required | Finalize install |
| DELETE | `/api/store/apps/:bundleId/uninstall` | Required | Uninstall |
| POST | `/api/store/apps/:bundleId/update` | Required | Start update |
| GET | `/api/store/installed` | Required | Installed apps |
| GET | `/api/store/downloads` | Required | Download history |
| GET | `/api/store/updates` | Required | Available updates |
| GET | `/api/store/developers/:slug` | Public | Developer profile |
| PATCH | `/api/store/settings` | Required | Store preferences |
| POST | `/api/store/seed` | Admin | Seed catalog |

## Socket Events

| Event | Payload |
|-------|---------|
| `store:download:progress` | `{ downloadId, bundleId, progress, status }` |
| `store:download:complete` | `{ downloadId, bundleId, type }` |
| `store:update:complete` | `{ bundleId, version }` |

## Usage

1. Open **Banana App** from Home Screen or Dock
2. Browse **Today** tab for featured/trending apps
3. Tap an app → view details → **Install**
4. Sign in when prompted (first install)
5. Watch installation animation with realtime progress
6. Manage apps in **Library** tab
7. Check **Updates** tab for available updates

## Seeded Catalog

On first API boot, 8 apps are seeded:
- Identity, Banana Bank, Phone, Messages, Police, Banana Social, Camera, Calculator

## Next App

**Identity** (`com.bananaos.identity`) — Phase 3 App 02
