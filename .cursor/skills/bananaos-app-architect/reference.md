# BananaOS App Architect — Reference

## Completed Apps (copy these)

| App | Bundle ID | PR Pattern |
|-----|-----------|------------|
| Banana App | `com.bananaos.store` | Store, seed, download |
| Identity | `com.bananaos.identity` | Verification, provisioning gate |
| Banana Bank | `com.bananaos.bank` | Finance, audit, realtime balance |
| Banana SIM | `com.bananaos.sim` | Full RBAC, admin panel, shared API |
| Contacts | `com.bananaos.contacts` | Multi-entity, import/export, groups |

## Frontend Scaffold

```
apps/web/src/apps/<app>/
├── manifest.ts          # AppManifest (bundleId, icon, permissions, route)
├── index.tsx            # App shell, tab routing, auth gates
├── types.ts             # Tab union, API response types
├── store/<app>Store.ts  # Zustand UI state only
├── services/<app>Service.ts  # apiRequest wrappers
├── hooks/use<App>Realtime.ts # invalidateQueries on socket events
├── components/          # TabBar, app-specific UI
├── screens/             # One file per tab/screen
└── __tests__/<app>.test.ts   # Zod schemas, formats, permissions
```

### manifest.ts template

```typescript
export const myManifest: AppManifest = {
  id: 'com.bananaos.<app>',
  bundleId: 'com.bananaos.<app>',
  name: 'App Name',
  version: '1.0.0',
  description: '...',
  icon: '📱',
  category: 'communication', // or finance, utilities
  permissions: ['network', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/<app>',
};
```

## Backend Scaffold

```
apps/api/src/
├── database/models/
│   ├── <Entity>.ts
│   ├── <App>Permission.ts
│   └── <App>AuditLog.ts
├── services/<app>Service.ts
├── api/controllers/<app>Controller.ts
├── api/controllers/<app>AdminController.ts  # if admin panel
└── api/routes/<app>.ts
```

### Permission model pattern

```typescript
export type AppPermissionName = 'view_x' | 'edit_x' | 'delete_x' | ...;
export const USER_DEFAULT_PERMISSIONS: AppPermissionName[] = [...];
export const ADMIN_PERMISSIONS: AppPermissionName[] = [...];
// Unique index: { userId: 1, permission: 1 }
```

### Service responsibilities

- `hasPermission` / `requirePermission` / `grantDefaultPermissions`
- `log<App>Audit(targetUserId, action, entityType, ctx, ...)`
- `send<App>Notification(userId, title, body, priority)`
- `emitToUser(userId, '<app>:created', payload)` via `socketService`
- Business logic + `format<Entity>()` helpers

### Controller pattern

```typescript
function auditCtx(req: AuthRequest, permission: PermName): AuditContext { ... }
async function checkPerm(req, permission) { ... }

export const create = asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  await checkPerm(req, 'edit_x');
  const entity = await createEntity(req.user!.userId, data, auditCtx(req, 'edit_x'));
  res.status(201).json({ success: true, data: formatEntity(entity) });
});
```

### Route ordering

Admin routes first → list/search routes → static paths (`/groups/list`) → `/:id` last.

## Shared API (for dependent apps)

```typescript
// apps/web/src/services/<app>Api.ts
export const <app>Api = {
  async lookup(id: string, appId: string) {
    return apiRequest(`/api/<app>/lookup/${id}`, {
      token: getToken(),
      headers: { 'X-App-Id': appId },
    });
  },
};
```

## Socket Events

1. Add to `packages/shared/src/types/index.ts` → `SocketEvent` union
2. Add to `apps/web/src/services/realtimeService.ts` events array
3. Create `use<App>Realtime.ts` invalidating `['<app>']` query keys

## docs/apps/<app>.md outline

```markdown
# App Name — One-line purpose
> Bundle ID: `com.bananaos.<app>`

## Overview
## Features (table with ✅)
## Architecture (file tree)
## Database Schema (table)
## RBAC Permissions (table)
## Audit Log
## API Endpoints (table)
## Flows
## Integration (shared APIs, dependencies)
## Socket Events
## Tests
## Roadmap
```

## Verification Commands

```bash
npm run build
cd apps/web && npx vitest run src/apps/<app>/__tests__/<app>.test.ts
```

## Do Not Modify

When building app N+1, do not edit completed apps unless adding a new integration hook they consume. Prefer:

- New shared API file (`simApi.ts`, `contactsApi.ts`)
- New socket event types
- New store seed entry
- New `registerApp()` line
