# GULF Browser (`com.gulfos.browser`)

Official web browser for GULFOS — access public server websites, government portals, banking, police systems (permission-based), justice services, and future Dark Web architecture.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.browser` |
| API Base | `/api/browser` |
| Default Search | GULF Search (`https://search.gulfos`) |
| Storage | ~680 MB (app) + download storage via Device Storage Manager |

## Features

### Browsing
- **Home / New Tab** — Quick links to seeded GULFOS portals
- **Tabs** — Create, close, pin, reorder, tab groups, tab overview
- **Private Browsing** — Incognito sessions (no history persistence)
- **GULF Search** — Default search engine with suggestions and search history
- **Navigation** — HTTPS validation, portal permission gates
- **Desktop Mode** — Wider layout toggle
- **Reader Mode** — Distraction-free reading
- **Find in Page** — Highlight matches in page content
- **Translate Page** — GULF Translate integration
- **QR Scanner / Generator** — Scan URLs, generate QR for current page
- **Share Page** — Deep link share payload
- **Open in App** — Deep links to Bank, Police, Justice, Maps, Communication

### Library
- **Bookmarks & Favorites**
- **History** — View and clear (non-incognito)
- **Reading List**
- **Offline Pages** — Cache page content for offline access
- **Recently Closed Tabs**

### Downloads
- Types: image, video, audio, PDF, ZIP, document, application
- Progress, pause, resume, cancel
- Download scanning hook (pending → clean/blocked)
- Storage integration via `deviceStorageService.reserveStorage`

### Security & Permissions
- HTTPS-only navigation (except `about:` URLs)
- Per-site permissions: location, camera, microphone, notifications, storage, clipboard, popups, background sync
- Password manager with AES-256-GCM encryption (biometric-gated retrieval)
- Autofill saved forms
- Saved cards (requires `cards.saved` permission / bank integration)

### Integrations
| Service | Capability |
|---------|------------|
| GULF Identity | Auto sign-in to government portals |
| GULF Bank | Banking portal + saved cards |
| GULF Police | Restricted law enforcement portals |
| GULF Justice | Court services |
| GULF Files | Download storage |
| GULF Gallery | Image downloads |
| GULF Maps | `geo:` and map link handling |
| Communication Core | Chat link deep links |
| VPN | Route traffic when enabled (permission-gated) |

## API Endpoints

### Core
| Method | Path | Description |
|--------|------|-------------|
| POST | `/initialize` | Initialize profile, session, seed sites |
| GET | `/home` | New tab home feed |
| GET | `/sites` | List accessible portal sites |
| POST | `/navigate` | Navigate tab to URL |
| GET | `/search?q=` | GULF Search |
| GET | `/search/suggestions?q=` | Search suggestions |
| GET | `/search/history` | Search history |

### Sessions & Tabs
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/sessions` | List / create sessions (incognito) |
| GET/POST | `/tabs` | List / create tabs |
| PATCH/DELETE | `/tabs/:tabId` | Update / close tab |
| GET | `/tabs/closed` | Recently closed tabs |
| GET/POST | `/tab-groups` | Tab groups |

### Library
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/bookmarks` | Bookmarks |
| DELETE | `/bookmarks/:bookmarkId` | Remove bookmark |
| GET/DELETE | `/history` | History |
| GET/POST | `/reading-list` | Reading list |
| GET/POST | `/offline` | Offline pages |

### Downloads
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/downloads` | List / start download |
| POST | `/downloads/:downloadId/control` | Pause / resume / cancel |

### Credentials
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/passwords` | Password manager |
| GET | `/passwords/:passwordId` | Retrieve password |
| GET/POST | `/forms` | Saved form fields |
| GET/POST | `/cards` | Saved payment cards |

### Tools
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/permissions` | Site permissions |
| POST | `/translate` | Translate page |
| POST | `/find` | Find in page |
| POST | `/qr/generate` | Generate QR |
| POST | `/qr/scan` | Scan QR |
| POST | `/share` | Share page |
| PATCH | `/profile` | Browser settings |
| GET/PATCH | `/rbac` | Role permissions (admin) |

## Realtime Events

- `browser:initialized`
- `browser:tab:update` / `browser:tab:sync`
- `browser:download:progress` / `browser:download:complete`
- `browser:history:update`
- `browser:bookmark:update`
- `browser:notification`
- `browser:session:sync`

## RBAC Roles

| Role | Access |
|------|--------|
| `user` | Standard browsing, no police/justice/dark web |
| `power_user` | + banking cards, biometrics, police/justice portals |
| `developer` | + developer tools, extensions framework |
| `admin` | Full access including audit and dark web ready architecture |

## Seeded Portal Sites

1. GULFOS Home — `https://www.gulfos.com`
2. GULF Search — `https://search.gulfos`
3. Gulf Government Portal — `https://portal.gulfos.gov`
4. GULF Bank Online — `https://bank.gulfos.finance`
5. GULF Police Systems — `https://police.gulfos.gov` (restricted)
6. Gulf Justice Services — `https://justice.gulfos.gov` (restricted)
7. GULF News — `https://news.gulfos.media`
8. Gulf Business Hub — `https://business.gulfos.com`

## Frontend

Located at `apps/web/src/apps/browser/`:
- `manifest.ts` — App manifest
- `index.tsx` — Full browser UI (tabs, address bar, panels, downloads, incognito)
- `services/browserService.ts` — API client
- `hooks/useBrowser.ts` — React Query hooks + socket sync

## Testing

```bash
npm run test --workspace=apps/api -- --test-name-pattern=browser
npm run build
```
