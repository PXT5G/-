# GULFOS Device Ecosystem

Phase 3.5 extends the operating system with production-ready device management systems. All services integrate with Identity, Bank, SIM, Phone, Contacts, Communication Core, World Engine, Notification Broker, and Permission Broker.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Device Ecosystem Orchestrator                   │
│              deviceEcosystemService.initialize / tick            │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   profile      power      security    storage     backup
   service     service     service    expansion    service
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
    sync      diagnostics maintenance developer  recovery
   service     service     service     mode      service
```

### Design principles

- **Extend only**: Builds on existing hardware, storage, diagnostics, and device state services
- **RBAC + audit**: Every mutation logs to `DeviceEcosystemAuditLog` and global `auditService`
- **Socket-first**: Realtime events for power, security, backup, sync, maintenance, recovery
- **Notification Broker**: Emergency shutdown and critical alerts route through `enqueueNotification`
- **Permission Broker**: Remote lock/wipe require biometrics permission (self-actions allowed)

## Systems

| # | System | Service | Key Features |
|---|--------|---------|--------------|
| 1 | Device Profiles | `deviceProfileService` | UUID, serial, generation, model, color, purchase date, warranty, region, language, timezone |
| 2 | Power System | `powerSystemService` | Battery degradation, health, charging cycles, fast/wireless charging, low/critical/emergency modes |
| 3 | Device Security | `deviceSecurityService` | Face, fingerprint, PIN, password, trusted devices, failed attempts, temp lock, remote lock/wipe |
| 4 | Storage Expansion | `storageExpansionService` | Downloads, trash, cache, app data, media library, system cleanup, duplicate detection |
| 5 | Device Backup | `deviceBackupService` | Automatic/manual backup, restore, version history, cloud backup queue |
| 6 | Device Sync | `deviceSyncService` | Cross-device sync for settings, contacts, messages, apps, wallpapers, preferences |
| 7 | Diagnostics | `deviceDiagnosticsService` | CPU, GPU, RAM, battery, network, sensors, FPS, system health, error reports |
| 8 | Device Maintenance | `deviceMaintenanceService` | Optimize storage, clear cache, repair DB, rebuild index, reset network/settings |
| 9 | Developer Mode | `developerModeService` | Logs, API/socket inspector, permission/storage/network viewers |
| 10 | System Recovery | `systemRecoveryService` | Safe/recovery mode, rollback updates, factory reset, backup restore |

## API

All endpoints mount at `/api/device/ecosystem/*` with authentication required.

### Initialize

```
POST /api/device/ecosystem/initialize
```

Called on boot via `initializeSystemServices()` and frontend `useDeviceEcosystemInit()`.

### Profile

```
GET  /api/device/ecosystem/profile
PATCH /api/device/ecosystem/profile
```

### Power

```
GET   /api/device/ecosystem/power
POST  /api/device/ecosystem/power/charging
PATCH /api/device/ecosystem/power/mode
```

### Security

```
GET   /api/device/ecosystem/security
PATCH /api/device/ecosystem/security
POST  /api/device/ecosystem/security/unlock
POST  /api/device/ecosystem/security/trusted-devices
POST  /api/device/ecosystem/security/remote-lock
POST  /api/device/ecosystem/security/remote-wipe
```

### Storage

```
GET  /api/device/ecosystem/storage
POST /api/device/ecosystem/storage/cleanup
POST /api/device/ecosystem/storage/empty-trash
GET  /api/device/ecosystem/storage/duplicates
```

### Backup

```
POST /api/device/ecosystem/backup
GET  /api/device/ecosystem/backup
GET  /api/device/ecosystem/backup/queue
POST /api/device/ecosystem/backup/:backupId/restore
```

### Sync

```
POST /api/device/ecosystem/sync
GET  /api/device/ecosystem/sync
GET  /api/device/ecosystem/sync/status
```

### Diagnostics

```
POST /api/device/ecosystem/diagnostics
GET  /api/device/ecosystem/diagnostics/history
```

### Maintenance

```
POST /api/device/ecosystem/maintenance
GET  /api/device/ecosystem/maintenance
```

### Developer Mode

```
GET /api/device/ecosystem/developer
GET /api/device/ecosystem/developer/logs
GET /api/device/ecosystem/developer/api
GET /api/device/ecosystem/developer/sockets
GET /api/device/ecosystem/developer/permissions
GET /api/device/ecosystem/developer/storage
GET /api/device/ecosystem/developer/network
```

### Recovery

```
GET   /api/device/ecosystem/recovery
PATCH /api/device/ecosystem/recovery/mode
POST  /api/device/ecosystem/recovery/rollback
POST  /api/device/ecosystem/recovery/factory-reset
POST  /api/device/ecosystem/recovery/restore/:backupId
```

## Socket Events

| Event | Description |
|-------|-------------|
| `device:ecosystem:ready` | Ecosystem initialized |
| `device:profile:update` | Profile changed |
| `device:power:update` | Power state changed |
| `device:power:emergency` | Emergency shutdown triggered |
| `device:security:update` | Security config changed |
| `device:security:unlocked` | Device unlocked |
| `device:security:remote_lock` | Remote lock applied |
| `device:security:remote_wipe` | Remote wipe completed |
| `device:backup:progress` | Backup in progress |
| `device:backup:complete` | Backup finished |
| `device:backup:restored` | Backup restored |
| `device:sync:progress` | Sync progress update |
| `device:sync:complete` | Sync finished |
| `device:maintenance:complete` | Maintenance action done |
| `device:recovery:update` | Recovery mode changed |
| `device:recovery:factory_reset` | Factory reset completed |
| `device:diagnostics:extended` | Extended diagnostics collected |

## Background Tasks

| Task | Interval | Description |
|------|----------|-------------|
| `device-ecosystem-tick` | 60s | Battery drain simulation + automatic backups |

## Frontend

- **Service**: `apps/web/src/services/deviceEcosystemService.ts`
- **Store**: `apps/web/src/stores/deviceEcosystemStore.ts` (Zustand)
- **Hooks**: `apps/web/src/hooks/useDeviceEcosystem.ts` (TanStack Query + socket sync)
- **Settings screens**: Security, Backup, Sync, Maintenance, Recovery under Device section

## Models

| Model | Purpose |
|-------|---------|
| `DeviceProfile` | Extended with purchase date, warranty, region, language, timezone |
| `DevicePowerState` | Battery degradation, charging cycles, power modes |
| `DeviceSecurityConfig` | Unlock methods, trusted devices, lock state |
| `DeviceBackup` | Backup versions with checksums |
| `DeviceSyncJob` | Cross-device sync jobs |
| `DeviceMaintenanceRecord` | Maintenance action history |
| `SystemRecoveryState` | Safe/recovery mode state |
| `DeveloperLog` | Developer mode logs |
| `DeviceEcosystemAuditLog` | Subsystem audit trail |

## Integrations

- **Identity**: Unlock uses `User` PIN/password via bcrypt
- **Communication Core**: Contacts/messages sync domains delegate to Communication Core
- **World Engine**: Diagnostics include network/carrier from world state
- **Notification Broker**: Emergency shutdown notifications
- **Permission Broker**: Remote lock/wipe RBAC, developer permission viewer
- **Existing device services**: Extends `hardwareService`, `deviceStorageService`, `diagnosticsService`, `systemUpdateService`

## Testing

```bash
npm test --workspace=apps/api -- deviceEcosystem
```

Unit tests cover constants, socket events, API route structure, background tasks, and storage categories.
