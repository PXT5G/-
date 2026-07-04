# System Control Panel (`com.bananaos.control-panel`)

Internal admin dashboard for the entire BananaOS platform. Admin-only access with all actions logged to `CoreAuditLog`.

## Features

| Module | Screen | API |
|--------|--------|-----|
| System Dashboard | `DashboardScreen` | `GET /api/control-panel/dashboard` |
| Permissions Manager | `PermissionsScreen` | `GET/POST /api/control-panel/permissions/*` |
| Audit Explorer | `AuditScreen` | `GET /api/control-panel/audit`, `GET /audit/export` |
| Realtime Monitor | `RealtimeScreen` | `GET /api/control-panel/realtime` + Socket `control:event` |
| Session Manager | `SessionsScreen` | `GET/POST /api/control-panel/sessions/*` |

## Platform Integration

All backend logic routes through the Core Platform layer:

- `controlPanelService` → `identityBridgeService`, `permissionEngineService`, `auditService`, `eventBusService`
- No direct app service calls
- Every admin view/action logged via `auditService`

## Security

- `authenticate` + `requireAdmin` on all `/api/control-panel` routes
- Frontend gated by `user.role === 'admin'`
- Force logout emits `session:expired` and disconnects sockets
- Permission overrides require explicit admin action with audit trail

## Realtime Monitoring

Admins subscribe via Socket.io `control-panel:subscribe` event. The `eventBusService` records all emitted events and streams them to the `admin:control` room as `control:event`.

## UI

- Glassmorphism dark premium theme
- Framer Motion animations
- CSS bar charts for event/audit breakdowns
- Mobile-responsive tab navigation
