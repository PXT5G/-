# BananaOS Security Auditor — Reference

## Security Review Checklist (per feature/PR)

### Authentication
- [ ] Protected routes use `authenticate` middleware
- [ ] Access tokens verified via `verifyAccessToken` (not decoded manually)
- [ ] Refresh flow uses separate secret (`JWT_REFRESH_SECRET`) and `type: 'refresh'`
- [ ] Sessions stored in `Session` model with TTL index on `expiresAt`
- [ ] Logout invalidates/revokes session server-side
- [ ] Login/register use `authRateLimiter`
- [ ] Passwords hashed with bcrypt (never stored plain)
- [ ] `sessionId` bound to token payload for session revocation

### Authorization
- [ ] Every mutation calls `requirePermission` or `checkPerm` in controller
- [ ] Admin routes use `requireAdmin` **and** app-specific permissions where applicable
- [ ] Ownership: queries include `{ userId: req.user.userId }` or equivalent
- [ ] Cross-user access impossible via IDOR (test with another user's resource ID)
- [ ] Client-side `isAdmin` UI gates are not the only protection

### RBAC
- [ ] `<App>Permission` model exists with typed permission union
- [ ] `USER_DEFAULT_PERMISSIONS` granted on init (`POST /permissions/init`)
- [ ] `ADMIN_PERMISSIONS` separate from user defaults
- [ ] Admin bypass in `hasPermission` only when `userRole === 'admin'`
- [ ] Permission denied returns 403, not 401 or 500

### Audit & Activity
- [ ] Every create/update/delete calls `log*Audit`
- [ ] Audit includes: userId, action, entityType, performedBy, permission, ip, deviceId
- [ ] Old/new values captured on updates
- [ ] Admin actions audited (not exempt)
- [ ] Sensitive reads (export, audit log view) permission-gated and logged if required

### Database
- [ ] All inputs validated with Zod before reaching Mongoose
- [ ] ObjectIds validated: `Types.ObjectId.isValid(id)` or try/catch on cast
- [ ] No raw `$where` or user-controlled query operators
- [ ] User data scoped by `userId` on every find/update/delete
- [ ] Soft delete doesn't leak deleted records in list endpoints
- [ ] Unique indexes prevent duplicate sensitive records
- [ ] No sensitive data in indexes that shouldn't be searchable

### API
- [ ] Zod schemas for body, query, and params
- [ ] `asyncHandler` wraps controllers (no unhandled rejections)
- [ ] `AppError` for 4xx; generic message for 500
- [ ] Correct status codes: 201 create, 404 not found, 403 forbidden
- [ ] Response shape `{ success, data }` — no raw error objects
- [ ] `helmet` and `cors` configured in `index.ts`
- [ ] File uploads: size limits, MIME validation, no executable paths

### Frontend
- [ ] Apps gate on `isAuthenticated` before rendering data
- [ ] Tokens via `getAccessToken()` — not hardcoded
- [ ] `session:expired` socket event handled (`useRealtime`)
- [ ] No secrets in `NEXT_PUBLIC_*` env vars
- [ ] Permission-aware UI matches API (hide + disable, but API is source of truth)
- [ ] Tokens in `storage` utility — review XSS exposure (sanitize user content)

### Realtime
- [ ] Socket middleware verifies JWT (`socketService.ts`)
- [ ] Events emitted only to `user:${userId}` room (no broadcast of private data)
- [ ] Service layer performs authz **before** `emitToUser`
- [ ] New socket events typed in `SocketEvent` union
- [ ] Client can't subscribe to other users' rooms

### Notifications
- [ ] Notifications scoped to `userId`
- [ ] `appId` set correctly (no cross-app spoofing)
- [ ] Priority levels used appropriately (no false critical alerts)

---

## OWASP Top 10 Checklist (BananaOS mapping)

| Risk | BananaOS Check |
|------|----------------|
| **A01 Broken Access Control** | RBAC + userId scope + ownership on every endpoint |
| **A02 Cryptographic Failures** | bcrypt passwords, JWT secrets in env, HTTPS in production |
| **A03 Injection** | Zod validation, Mongoose parameterized queries, no eval |
| **A04 Insecure Design** | Audit logs, permission model per app, fail-closed auth |
| **A05 Security Misconfiguration** | helmet, cors origin, rate limits, no default creds in prod |
| **A06 Vulnerable Components** | Keep deps updated (`npm audit`) |
| **A07 Auth Failures** | Rate-limited login, refresh rotation, session expiry |
| **A08 Data Integrity** | Zod on input, signed JWTs, audit trail on changes |
| **A09 Logging Failures** | AuditLog per app, no silent permission denials |
| **A10 SSRF** | Validate external URLs if apps fetch remote resources |

---

## RBAC Checklist (per app)

```
App: _______________  Bundle ID: _______________

Permissions defined:
- [ ] view_<resource>
- [ ] edit_<resource>
- [ ] delete_<resource>
- [ ] export_<resource> (if applicable)
- [ ] import_<resource> (if applicable)
- [ ] manage_<admin_feature> (admin only)
- [ ] view_audit_logs (admin only)

Endpoints mapped:
| Endpoint | Method | Permission | Ownership |
|----------|--------|------------|-----------|
|          |        |            |           |

Admin bypass documented: yes / no
Default user permissions granted on init: yes / no
```

---

## Audit Checklist (per app)

```
App: _______________

Audit model: <App>AuditLog
Log function: log<App>Audit()

Actions that MUST be audited:
- [ ] create
- [ ] update (with old/new values)
- [ ] delete
- [ ] permission grant/revoke
- [ ] admin suspend/activate
- [ ] export/import
- [ ] block/unblock
- [ ] security setting changes

Fields captured:
- [ ] userId (target)
- [ ] performedBy
- [ ] performedByRole
- [ ] permission used
- [ ] ipAddress
- [ ] deviceId (from x-device-id header)
- [ ] reason (when applicable)
- [ ] timestamp (createdAt)
```

---

## API Security Checklist (per endpoint)

```
Endpoint: __METHOD__ /api/<app>/<path>

- [ ] authenticate middleware
- [ ] requireAdmin (if admin-only)
- [ ] checkPerm / requirePermission
- [ ] Zod schema validates all inputs
- [ ] userId scope in service query
- [ ] AppError on not found (404) not 200 with null
- [ ] Audit log on mutation
- [ ] Socket emit after successful mutation
- [ ] Rate limit appropriate (global or custom)
- [ ] No sensitive data in URL params (prefer POST body)
- [ ] ObjectId params validated
```

### Status code guide

| Situation | Code |
|-----------|------|
| Missing/invalid token | 401 |
| Valid token, no permission | 403 |
| Resource not found | 404 |
| Validation failure | 400 |
| Business rule violation | 400 |
| Created | 201 |
| Success | 200 |
| Server error | 500 (generic message) |

---

## Session & Token Review

**Files:** `jwtService.ts`, `Session.ts`, `auth.ts` routes, `authStore.ts`

- [ ] Access token short-lived (`JWT_EXPIRES_IN`)
- [ ] Refresh token long-lived, separate secret
- [ ] Refresh endpoint validates session still exists
- [ ] Logout deletes session record
- [ ] `session:expired` emitted on forced logout
- [ ] TrustedDevice model used for device binding where required
- [ ] Biometric flags are architecture-ready (SIM `biometricEnabled`) — not security bypass

---

## Socket.io Security Review

**File:** `apps/api/src/services/socketService.ts`

```typescript
// ✅ Required pattern
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // verify JWT, attach userId
});

emitToUser(userId, event, data); // only to user:${userId} room
```

- [ ] No client-triggered events that mutate data without server validation
- [ ] No `io.emit()` for user-private events
- [ ] CORS on socket matches API CORS origin

---

## MongoDB Security Patterns

```typescript
// ✅ Scoped query
await Contact.findOne({ _id: contactId, userId: req.user.userId });

// ✅ ObjectId validation
if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID');

// ✅ Zod before DB
const data = schema.parse(req.body);

// ❌ Never
await Model.findOne({ _id: req.params.id }); // missing userId
await Model.find(JSON.parse(userInput));     // injection risk
```

---

## Frontend Token Security

```typescript
// ✅ API calls
token: useAuthStore.getState().getAccessToken()

// ✅ Socket connect
realtimeService.connect(token);

// Review on persist:
// authStore uses zustand persist — ensure no token in URL/logs
```

- [ ] Logout clears tokens from store and storage
- [ ] 401 responses trigger refresh or logout flow
- [ ] Admin UI doesn't expose admin API keys

---

## Review Output Template

```markdown
## Security Review: [Feature/App]

### Summary
[One paragraph — approve / conditional / reject]

### Findings

#### 🔴 Critical (must fix)
- ...

#### 🟡 Warnings (should fix)
- ...

#### 🟢 Passed
- ...

### Checklists Completed
- [ ] RBAC
- [ ] Audit
- [ ] API
- [ ] OWASP
- [ ] Realtime
- [ ] Frontend
```

---

## Never Approve If

- Mutation endpoint lacks permission check
- User can access another user's data by ID
- No audit log on financial/identity/SIM/contact changes
- Passwords or tokens logged to console
- `any` type on security-critical paths
- Socket events expose data without authz in service layer
- Rate limiting removed from auth routes
