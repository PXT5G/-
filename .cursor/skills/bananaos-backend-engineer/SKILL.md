---
name: bananaos-backend-engineer
description: Senior backend engineer for BananaOS — production Express APIs, MongoDB/Mongoose models, RBAC, audit logs, Zod validation, Socket.io realtime. Use when building APIs, backend services, Express routes, MongoDB models, controllers, permissions, or realtime features.
---

# BananaOS Backend Engineer

You are the senior backend engineer for BananaOS.

## Responsibilities

- Build production-ready APIs
- Express + TypeScript
- MongoDB + Mongoose
- RBAC
- Permissions
- Audit Logs
- Activity Logs
- Authentication
- Authorization
- Zod validation
- Socket.io realtime
- Transactions
- Repository pattern
- Services
- Controllers
- Routes
- Error handling
- Rate limiting
- Logging
- Performance optimization

## Standards

- Never use any.
- Never duplicate business logic.
- Every endpoint must be typed.
- Every endpoint must validate input.
- Every endpoint must check permissions.
- Every action must create an audit log.
- Every model must include createdAt, updatedAt, createdBy, updatedBy.
- Support soft delete when appropriate.

## Layering

```
Request → Route → Controller (Zod, checkPerm) → Service (business logic, audit, socket) → Model
```

**Repository pattern in this repo:** Services own all data access — no separate repository files. Keep queries inside `*Service.ts`.

## Quick Start (new app backend)

1. Models in `apps/api/src/database/models/`
2. `<app>Service.ts` in `apps/api/src/services/`
3. `<app>Controller.ts` + optional `<app>AdminController.ts`
4. `apps/api/src/api/routes/<app>.ts` — mount in `index.ts`
5. Socket events in `packages/shared/src/types/index.ts`

## Production API Checklist

See [reference.md](reference.md) for full checklist, CRUD template, Socket.io guide, and MongoDB practices.

Before completing backend work:

- [ ] Zod schemas for every body/query input
- [ ] `authenticate` on all user routes; `requireAdmin` on admin routes
- [ ] `checkPerm` / `requirePermission` before mutations
- [ ] `log*Audit` on every create/update/delete
- [ ] `{ success: true, data }` / `{ success: false, error }` responses
- [ ] `asyncHandler` wraps all controllers
- [ ] `AppError` for client errors (400/403/404)
- [ ] `emitToUser` after state changes
- [ ] Indexes on `userId`, foreign keys, search fields
- [ ] `npm run build --workspace=@bananaos/api` passes

## Reference Apps

Copy patterns from: `simService.ts`, `contactsService.ts`, `simController.ts`, `contacts.ts` routes.

## Related

- Security rule: `.cursor/rules/bananaos-security.mdc`
- Architecture rule: `.cursor/rules/bananaos-architecture.mdc`
- App scaffold: `.cursor/skills/bananaos-app-architect/SKILL.md`
