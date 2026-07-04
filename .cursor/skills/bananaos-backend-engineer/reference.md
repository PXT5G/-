# BananaOS Backend Engineer — Reference

## Folder Structure

```
apps/api/src/
├── index.ts                      # Mount routes, helmet, cors, rate limit
├── config/env.ts                 # Zod-validated env
├── database/
│   ├── connection.ts
│   └── models/
│       ├── <Entity>.ts
│       ├── <App>Permission.ts
│       └── <App>AuditLog.ts
├── services/
│   ├── <app>Service.ts           # Business logic + data access (repository layer)
│   ├── socketService.ts          # emitToUser, initializeSocket
│   └── jwtService.ts
└── api/
    ├── middleware/
    │   ├── auth.ts               # authenticate, requireAdmin
    │   ├── errorHandler.ts       # AppError, asyncHandler
    │   └── rateLimit.ts          # globalRateLimiter, authRateLimiter
    ├── controllers/
    │   ├── <app>Controller.ts
    │   └── <app>AdminController.ts
    └── routes/
        └── <app>.ts
```

## Production API Checklist

### Models
- [ ] TypeScript interface `I<Entity>` extends `Document`
- [ ] Typed enums as union types + schema `enum`
- [ ] `{ timestamps: true }` (provides `createdAt`, `updatedAt`)
- [ ] `createdBy`, `updatedBy` as `ObjectId` refs when user-owned
- [ ] `deletedAt` for soft delete (use `status: 'archived'` or `deletedAt` field)
- [ ] Indexes: `{ userId: 1 }`, compound unique where needed
- [ ] `userId` scope on all user data queries

### Permissions
- [ ] `<App>Permission` model with typed `PermissionName` union
- [ ] `USER_DEFAULT_PERMISSIONS` and `ADMIN_PERMISSIONS` arrays
- [ ] Unique index `{ userId: 1, permission: 1 }`
- [ ] `hasPermission`, `requirePermission`, `grantDefaultPermissions`
- [ ] `POST /permissions/init` endpoint for first-run grant

### Audit
- [ ] `<App>AuditLog` model: userId, action, entityType, entityId, performedBy, permission, deviceId, ipAddress, oldValue, newValue, reason
- [ ] `AuditContext` from controller: `performedBy`, `performedByRole`, `permission`, `ipAddress`, `deviceId`
- [ ] Log on every mutation — never skip admin actions

### Routes
- [ ] Admin routes first with `requireAdmin`
- [ ] Static paths before `/:id` (`/search`, `/groups/list`, `/export/all`)
- [ ] `authenticate` on all protected routes
- [ ] Mount: `app.use('/api/<app>', <app>Routes)` in `index.ts`

### Controller
- [ ] Zod schema per endpoint; `schema.parse(req.body)`
- [ ] `asyncHandler` wrapper
- [ ] `checkPerm(req, 'permission_name')` before service call
- [ ] Typed JSON responses only

### Service
- [ ] All business logic here — not in controllers
- [ ] `requirePermission` at start of mutations
- [ ] `format<Entity>()` helpers for API responses
- [ ] `send<App>Notification` + `emitToUser` after changes
- [ ] No `any`; use `Types.ObjectId` for IDs

### Realtime
- [ ] Add events to `SocketEvent` in `packages/shared/src/types/index.ts`
- [ ] Emit from service: `emitToUser(userId, '<app>:created', payload)`
- [ ] Frontend: add event to `realtimeService.ts` events array

### Verification
- [ ] `npm run build --workspace=@bananaos/api`
- [ ] Manual or integration test of critical paths

---

## CRUD Template

### Model (`database/models/Widget.ts`)

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWidget extends Document {
  userId: Types.ObjectId;
  name: string;
  status: 'active' | 'archived';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const widgetSchema = new Schema<IWidget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

widgetSchema.index({ userId: 1, name: 1 });

export const Widget = mongoose.model<IWidget>('Widget', widgetSchema);
```

### Service (`services/widgetService.ts`)

```typescript
export async function createWidget(
  userId: string,
  input: { name: string },
  ctx: AuditContext
): Promise<IWidget> {
  await requirePermission(userId, 'edit_widgets', ctx.performedByRole as 'user' | 'admin');

  const widget = await Widget.create({
    userId,
    name: input.name,
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });

  await logWidgetAudit(userId, 'widget_created', 'Widget', ctx, widget._id.toString(), undefined, input.name);
  emitToUser(userId, 'widget:created', { widgetId: widget._id.toString() });
  return widget;
}

export async function deleteWidget(userId: string, widgetId: string, ctx: AuditContext): Promise<void> {
  await requirePermission(userId, 'delete_widgets', ctx.performedByRole as 'user' | 'admin');

  const widget = await Widget.findOne({ _id: widgetId, userId, deletedAt: { $exists: false } });
  if (!widget) throw new Error('Widget not found');

  // Soft delete
  widget.deletedAt = new Date();
  widget.status = 'archived';
  widget.updatedBy = new Types.ObjectId(ctx.performedBy);
  await widget.save();

  await logWidgetAudit(userId, 'widget_deleted', 'Widget', ctx, widgetId, widget.name);
  emitToUser(userId, 'widget:deleted', { widgetId });
}
```

### Controller (`api/controllers/widgetController.ts`)

```typescript
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const createSchema = z.object({ name: z.string().min(1).max(100) });

function auditCtx(req: AuthRequest, permission: WidgetPermissionName): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: req.user!.role,
    permission,
    ipAddress: req.ip,
    deviceId: req.headers['x-device-id'] as string | undefined,
  };
}

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  try {
    const widget = await createWidget(req.user!.userId, data, auditCtx(req, 'edit_widgets'));
    res.status(201).json({ success: true, data: formatWidget(widget) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create failed');
  }
});
```

### Routes (`api/routes/widget.ts`)

```typescript
import { Router } from 'express';
import * as widgetController from '../controllers/widgetController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/permissions/init', authenticate, widgetController.initPermissions);
router.get('/dashboard', authenticate, widgetController.getDashboard);
router.get('/', authenticate, widgetController.list);
router.post('/', authenticate, widgetController.create);
router.get('/:id', authenticate, widgetController.getById);
router.put('/:id', authenticate, widgetController.update);
router.delete('/:id', authenticate, widgetController.remove);

export default router;
```

---

## Socket.io Integration Guide

### 1. Define event type

`packages/shared/src/types/index.ts`:

```typescript
export type SocketEvent =
  | 'widget:created'
  | 'widget:updated'
  | 'widget:deleted'
  | 'widget:notification';
```

### 2. Emit from service

```typescript
import { emitToUser } from './socketService';

emitToUser(userId, 'widget:created', {
  widgetId: widget._id.toString(),
  name: widget.name,
});
```

`emitToUser` wraps payload as `{ event, data, timestamp }` and sends to room `user:${userId}`.

### 3. Notifications (optional)

```typescript
await Notification.create({
  userId,
  appId: 'com.bananaos.widget',
  title: 'Widget Created',
  body: `Created ${widget.name}`,
  icon: '📦',
  priority: 'normal',
});
emitToUser(userId, 'notification:new', { /* ... */ });
emitToUser(userId, 'widget:notification', { title, body });
```

### 4. Frontend listener

Add event to `apps/web/src/services/realtimeService.ts` events array.
Create `useWidgetRealtime.ts` to invalidate TanStack Query keys.

### Socket auth

Clients connect with `auth: { token }`. Server validates JWT in `socketService.ts` middleware.

---

## MongoDB Best Practices

### Indexes
- Always index `userId` on user-scoped collections
- Compound unique: `{ userId: 1, permission: 1 }`, `{ userId: 1, email: 1 }`
- Index fields used in `$regex` search sparingly; prefer text index for full-text

### Queries
- Scope every query: `{ userId, status: 'active', deletedAt: { $exists: false } }`
- Use `.lean()` for read-only list endpoints when not calling instance methods
- `limit()` on search — default 50–100 max
- Project only needed fields on large documents

### Schema
- Subdocuments without `_id` when array items are value objects: `{ _id: false }`
- `pre('save')` hooks for derived fields (e.g. `fullName`)
- Validate arrays: `validate: [(v) => v.length > 0, 'message']`

### Soft Delete
```typescript
// Query active only
Contact.find({ userId, deletedAt: { $exists: false } });

// Soft delete
await Model.findOneAndUpdate(
  { _id: id, userId },
  { deletedAt: new Date(), status: 'archived', updatedBy }
);
```

### Transactions (multi-document)

Use when multiple collections must update atomically:

```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await PhoneNumber.create([{ ... }], { session });
  await SIMProfile.create([{ ... }], { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

Prefer transactions for provisioning flows (SIM + phone number + settings).

### ObjectIds
```typescript
import { Types } from 'mongoose';
entityId: entityId ? new Types.ObjectId(entityId) : undefined
```

---

## Error Handling

| Case | Pattern |
|------|---------|
| Validation fail | Zod throws → catch in `asyncHandler` → 500; prefer `schema.safeParse` or let Zod error map to 400 |
| Not found | `throw new AppError(404, 'Not found')` |
| Permission denied | `throw new AppError(403, 'Permission denied: x')` |
| Business rule | `throw new AppError(400, message)` |
| Unexpected | Logged in `errorHandler` → 500 generic message |

## Rate Limiting

- Global: `globalRateLimiter` in `index.ts` (all routes)
- Auth routes: `authRateLimiter` on `/api/auth/login`, `/register`

## Logging

Use `console.error('[Error]', err)` in error handler. For audit trail, always use `<App>AuditLog` — not console.log for user actions.

## Performance

- Paginate lists: `.skip(offset).limit(limit)`
- `Promise.all` for independent reads in dashboard endpoints
- Avoid N+1: batch load related docs or use aggregation
- Index foreign keys used in `$lookup` or manual joins

## Response Types

```typescript
// Success
res.json({ success: true, data: T });
res.status(201).json({ success: true, data: T });

// Error (via AppError)
{ success: false, error: string }
```
