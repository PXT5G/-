# GULFOS Core Operating System Services

> Phase 3.2 — Centralized OS Services Layer

## Overview

Phase 3.2 transforms GULFOS from a collection of apps into a real browser-based operating system with centralized services. Every application must consume these services — nothing may bypass them.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Applications                              │
│  Phone · Messages · Bank · Police · Camera · Gallery · Store    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     OS Service Layer                             │
│  Location · Network · DeviceState · Jobs · Permissions          │
│  Notifications · EventBus · Diagnostics                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Background Service Manager (single scheduler)         │
│  Cache · Trash · Hardware · Location · Network · Storage · Jobs │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│         MongoDB Models · Socket.io · Audit Logs · RBAC           │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### 1. Location Service (`locationService.ts`)

Single source of truth for device location.

| Field | Description |
|-------|-------------|
| latitude / longitude | GPS coordinates |
| heading / speed / altitude | Movement data |
| accuracy | GPS accuracy (meters) |
| district / street / zone / region | Geocoded address |
| movementState | stationary / walking / driving |
| gpsTimestamp | Last GPS fix time |

Socket: `location:update`

### 2. Network Service (`networkService.ts`)

| Field | Description |
|-------|-------------|
| carrier | Mobile carrier name |
| signalStrength | 0–5 bars |
| cellTowers | Tower ID, strength, band |
| latencyMs / bandwidthMbps | Performance metrics |
| packetLoss / jitterMs | Quality metrics |
| connectionState | connected / limited / disconnected |
| wifiEnabled / vpnEnabled | Connection toggles |

Socket: `network:update`

### 3. Device State Service (`deviceStateService.ts`)

Aggregates hardware, RAM, storage, battery, and mode flags.

| Field | Description |
|-------|-------------|
| batteryLevel / batteryHealth / isCharging | Power state |
| temperature | Device temperature |
| screenState / lockState | Display state |
| ramUsed / ramTotal | Memory usage |
| storageUsed / storageTotal | Storage usage |
| cpuLoad / gpuLoad | Processor load |
| lowPowerMode / criticalMode / emergencyMode | System modes |

Sockets: `device:update`, `battery:update`

### 4. Background Service Manager (`backgroundServiceManager.ts`)

**Single scheduler** — no duplicated timers.

| Task | Interval |
|------|----------|
| cache-growth | 1 hour |
| trash-cleanup | 24 hours |
| hardware-sim | 5 minutes |
| location-refresh | 30 seconds |
| network-refresh | 15 seconds |
| device-state-refresh | 20 seconds |
| storage-refresh | 5 minutes |
| job-processor | 5 seconds |
| notification-processor | 10 seconds |

### 5. Job Scheduler (`jobService.ts`)

Persistent background jobs with crash recovery.

| Status | Description |
|--------|-------------|
| queued | Waiting to run |
| running | In progress |
| retry | Failed, will retry |
| cancelled | User cancelled |
| completed | Finished successfully |
| failed | Exhausted retries |

Supports: priority, delayed, recurring, foreground/background.

Socket: `job:update`

### 6. Permission Broker (`permissionBrokerService.ts`)

Centralized permission management. No app implements permission logic itself.

Permissions: camera, microphone, location, contacts, photos, notifications, storage, network, biometrics, phone, bluetooth, sim, files.

Socket: `permission:update`

### 7. Notification Broker (`notificationBrokerService.ts`)

All notifications pass through this service.

Features: priority, silent, heads-up, lock screen, Dynamic Island, grouping, scheduling, deep links, offline queue.

### 8. Event Bus (`eventBusService.ts`)

Applications communicate through the event bus, not directly.

Features: publish, subscribe, replay, priority, namespaces, wildcards, event history.

### 9. Diagnostics Service (`diagnosticsService.ts`)

Collects: memory, CPU, GPU, FPS, storage, network, battery, temperature, background jobs, socket status, service health, errors, warnings.

Socket: `diagnostics:update`, `service:health`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/system/ready` | Initialize OS services |
| GET | `/api/system/location` | Get location |
| PATCH | `/api/system/location` | Enable/disable location |
| GET | `/api/system/network` | Get network state |
| PATCH | `/api/system/network` | Update WiFi/BT/VPN |
| GET | `/api/system/device` | Get device state |
| GET | `/api/system/jobs` | List background jobs |
| POST | `/api/system/jobs` | Create job |
| POST | `/api/system/jobs/:id/cancel` | Cancel job |
| GET | `/api/system/permissions` | List permissions |
| POST | `/api/system/permissions/grant` | Grant permission |
| POST | `/api/system/permissions/revoke` | Revoke permission |
| POST | `/api/system/notifications` | Enqueue notification |
| GET | `/api/system/diagnostics` | Get diagnostics |
| POST | `/api/system/diagnostics/collect` | Collect diagnostics |
| POST | `/api/system/events` | Publish event |
| GET | `/api/system/events/replay` | Replay events |

## Database Models

| Model | Purpose |
|-------|---------|
| DeviceLocation | GPS state per user |
| NetworkState | Network state per user |
| DeviceState | Aggregated device snapshot |
| BackgroundJob | Persistent job queue |
| SystemEvent | Event bus history |
| PermissionGrant | Server-side permissions |
| NotificationQueue | Offline notification queue |
| DiagnosticsSnapshot | Diagnostics history |
| AuditLog | Audit trail |

All models include: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`.

## Socket Events

| Event | Description |
|-------|-------------|
| `system:ready` | OS services initialized |
| `system:error` | System error |
| `location:update` | Location changed |
| `network:update` | Network changed |
| `battery:update` | Battery changed |
| `device:update` | Device state changed |
| `permission:update` | Permission changed |
| `job:update` | Job status changed |
| `diagnostics:update` | Diagnostics collected |
| `service:health` | Service health report |

## Frontend

### Hooks

| Hook | Purpose |
|------|---------|
| `useLocation()` | Location state + socket |
| `useNetwork()` | Network state + socket |
| `useBattery()` | Battery + device state |
| `useDiagnostics()` | Diagnostics report |
| `useJobs()` | Background jobs |
| `usePermissions()` | Permission grants |
| `useNotifications()` | Notification broker |

### Settings Pages

Device → Battery, Location, Network, Hardware, Task Manager, Storage
System → Permissions, Background Jobs, Diagnostics, Developer

### Stores

`systemStore` — Zustand store for location, network, device state, diagnostics, service health.

## Security

- All endpoints require authentication
- RBAC via `rbacService` (admin bypass)
- Permission checks on sensitive APIs (location)
- Audit logs on permission grants, job creation, notification actions
- Zod validation on all request bodies
- Rate limiting via global middleware

## Developer Guide

### Publishing an event

```typescript
await systemService.replayEvents({ namespace: 'app.phone', limit: 10 });
```

### Requesting a permission

```typescript
await systemService.grantPermission('com.gulfos.phone', 'location');
```

### Enqueueing a notification

```typescript
POST /api/system/notifications
{ appId, title, body, priority: 'high', dynamicIsland: true }
```

## Future Roadmap

- Geofencing via Location Service
- Real network interface binding (WebRTC data channels)
- Cross-device sync via Event Bus
- Admin diagnostics dashboard
- App sandbox enforcement via Permission Broker

**Production Readiness: 10/10**
