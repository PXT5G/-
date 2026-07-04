# GULF Poetry — com.gulfos.poetry

Phase 4 App 08 delivers the official server poetry platform for GULFOS. The Server Poet and authorized poets can publish poems, spoken poetry, national verses, event writings, and official server literature.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GULF Poetry (Frontend)                        │
│         PoetryApp → usePoetry → poetryService → Socket.io        │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   poetryService  poetryRBAC  poetryIntegration  Notifications
   (CRUD)        Service      Service            Identity
```

## Bundle ID

`com.gulfos.poetry`

## Roles (RBAC)

| Role | Description |
|------|-------------|
| `server_poet` | Highest authority — full platform control |
| `poet` | Publish and manage own poems |
| `assistant_poet` | Assist publishing, drafts, collections |
| `publisher` | Schedule and publish content |
| `moderator` | Approve, reject, feature, hide content |
| `viewer` | Read, like, bookmark, comment |

Permissions are configurable via `PoetryRoleConfig` and `/api/poetry/rbac`.

## Poem Categories

National, Pride, Military, Police, Justice, Love, Sadness, Wisdom, Religion, Occasions, Events, Server Story, Roleplay, Custom

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/poetry/initialize` | Register poet profile, seed content |
| GET | `/api/poetry/home` | Featured, latest, popular, daily, trending |
| GET | `/api/poetry/random` | Random published poem |
| GET | `/api/poetry/search` | Search by title, author, category, tags |
| GET/POST | `/api/poetry/poems` | List / create poems |
| GET/PATCH/DELETE | `/api/poetry/poems/:id` | Read / update / delete |
| GET | `/api/poetry/poems/:id/versions` | Version history |
| GET | `/api/poetry/poems/:id/export` | PDF/text export |
| POST | `/api/poetry/poems/:id/like` | Toggle like |
| GET/POST | `/api/poetry/poems/:id/comments` | Comments |
| POST | `/api/poetry/poems/:id/bookmark` | Toggle bookmark |
| POST | `/api/poetry/poems/:id/favorite` | Toggle favorite |
| POST | `/api/poetry/poems/:id/share` | Share poem |
| POST | `/api/poetry/poems/:id/moderate` | Moderation actions |
| POST | `/api/poetry/poems/:id/daily` | Set daily poem |
| GET | `/api/poetry/bookmarks` | User bookmarks |
| GET | `/api/poetry/favorites` | User favorites |
| GET | `/api/poetry/history` | Reading history |
| GET/PATCH | `/api/poetry/profile` | Poet profile |
| GET | `/api/poetry/profile/:userId` | Author profile |
| POST | `/api/poetry/follow/:userId` | Follow/unfollow |
| GET | `/api/poetry/verified-poets` | Verified poets list |
| GET/POST | `/api/poetry/collections` | Poem collections |
| GET/POST | `/api/poetry/events` | Poetry events |
| GET | `/api/poetry/competitions` | Competitions |
| GET | `/api/poetry/challenges` | Writing challenges |
| GET | `/api/poetry/moderation/logs` | Audit moderation logs |
| GET | `/api/poetry/analytics` | Platform statistics |
| GET/PATCH | `/api/poetry/rbac` | Role permissions |
| POST | `/api/poetry/announcements` | Broadcast announcements |

## MongoDB Models

- `PoetryProfile` — poet profiles, badges, stats
- `PoetryPoem` — poems with rich text, media, scheduling
- `PoetryPoemVersion` — version history / auto-save
- `PoetryCollection` — curated poem collections
- `PoetryComment` — threaded comments
- `PoetryLike`, `PoetryBookmark`, `PoetryFavorite`, `PoetryShare`
- `PoetryFollow` — follower graph
- `PoetryHistory` — reading history
- `PoetryEvent`, `PoetryCompetition`, `PoetryChallenge`
- `PoetryAnnouncement` — platform announcements
- `PoetryRoleConfig` — RBAC configuration
- `PoetryModerationLog` — moderation audit trail

## Realtime Events

- `poetry:initialized` — poet session ready
- `poetry:poem:new` / `poetry:poem:update` / `poetry:poem:published`
- `poetry:comment:new` — live comments
- `poetry:like` — live likes
- `poetry:announcement` — broadcasts
- `poetry:moderation` — moderation actions
- `poetry:event:update` / `poetry:competition:update` / `poetry:challenge:update`
- `poetry:trending:update`

## Integrations

| System | Usage |
|--------|-------|
| Identity (`com.gulfos.identity`) | Author verification |
| Notifications | Likes, follows, publishes |
| Communication Core | Share deep links |
| Files / Gallery | Image attachments |
| Voice Recorder | Audio poetry |

## Frontend

Located at `apps/web/src/apps/poetry/`:

- **Home** — Featured, latest, popular, daily poem, trending, categories
- **Library** — Bookmarks, favorites, history, collections, drafts
- **Search** — Full-text search, verified poets
- **Compose** — Rich text / Markdown editor, draft & publish
- **More** — Events, competitions, challenges, analytics

Design: GULFOS glassmorphism with red/silver GULF Poetry branding, Dynamic Island compatible activity flows.

## Store

Listed in GULF Store as premium app (`com.gulfos.poetry`, 520 MB).

## Developer Checklist

1. Add permission to `constants/poetry.ts`
2. Assign to roles in `DEFAULT_ROLE_PERMISSIONS`
3. Create Mongoose model
4. Add service method with `assertPoetryPermission`
5. Add controller handler + route
6. Add frontend API method + hook + UI
7. Add socket event if realtime
8. Log via `logPoetryAction` / `logModerationAction`
