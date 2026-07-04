# GULFOS Global Rebrand — Phase 4.1

> BananaOS → GULFOS identity migration

## Brand Identity

| Property | Value |
|----------|-------|
| OS Name | GULFOS |
| Company | Gulf Technologies |
| Developer | Abu Sharaf |
| Device | Gulf Phone V1 |
| Carrier | GULF Mobile |
| Core Services | GULF Core |
| Store | GULF Store |

## Package Names

| Legacy | Canonical |
|--------|-----------|
| `@bananaos/shared` | `@gulfos/shared` |
| `@bananaos/api` | `@gulfos/api` |
| `@bananaos/web` | `@gulfos/web` |
| `bananaos` (root) | `gulfos` |

## Bundle ID Migration

All application bundle identifiers use the `com.gulfos.*` namespace. Legacy `com.bananaos.*` IDs are resolved automatically via the shared migration layer.

**Special case:** `com.bananaos.voicerecorder` → `com.gulfos.recorder` (GULF Recorder)

### Application Display Names

| Legacy | GULF |
|--------|------|
| Banana App | GULF Store |
| Banana Bank | GULF Bank |
| Banana Maps | GULF Maps |
| Banana Police | GULF Police |
| Banana Social | GULF Social |
| Banana Voice Recorder | GULF Recorder |
| … | (see manifests and store seed) |

## Migration Layer

Located in `packages/shared/src/migration/bundleIds.ts`:

- `resolveBundleId(id)` — returns canonical GULFOS bundle ID
- `bundleIdVariants(id)` — returns `[canonical, legacy]` for DB queries
- `bundleIdQuery(id)` — MongoDB `$in` filter helper
- `isSameBundleId(a, b)` — equality across legacy/canonical

API services use `apps/api/src/utils/bundleIdMigration.ts` at install, package, and permission boundaries.

## Client Storage Migration

| Legacy Key | Canonical Key |
|------------|---------------|
| `bananaos-settings` | `gulfos-settings` |
| `bananaos_*` localStorage prefix | `gulfos_*` |

`apps/web/src/utils/storage.ts` migrates legacy keys on load.

## CSS Compatibility

Legacy Tailwind/CSS tokens remain aliased:

- `--color-banana-gold` → `--color-gulf-gold`
- `.wallpaper-banana` → `.wallpaper-gulf`

## Deep Links

| Legacy | Canonical |
|--------|-----------|
| `bananaos://` | `gulfos://` |

## Docker / Database

- MongoDB database: `gulfos`
- Container names: `gulfos-mongodb`, `gulfos-api`, `gulfos-web`

## Verification

```bash
npm run build
npm run test --workspace=@gulfos/shared
npm run test --workspace=@gulfos/api
npm run test --workspace=@gulfos/web
```
