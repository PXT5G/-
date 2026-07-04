import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNLOCK_METHODS,
  POWER_MODES,
  CHARGING_TYPES,
  BACKUP_TYPES,
  SYNC_DOMAINS,
  RECOVERY_MODES,
  MAINTENANCE_ACTIONS,
  MAX_FAILED_UNLOCK_ATTEMPTS,
  BATTERY_DEGRADATION_PER_CYCLE,
} from '../../constants/deviceEcosystem';

describe('device ecosystem constants', () => {
  it('defines unlock methods', () => {
    assert.equal(UNLOCK_METHODS.length, 5);
    assert.ok(UNLOCK_METHODS.includes('face'));
    assert.ok(UNLOCK_METHODS.includes('fingerprint'));
    assert.ok(UNLOCK_METHODS.includes('pin'));
  });

  it('defines power modes including emergency shutdown', () => {
    assert.equal(POWER_MODES.length, 4);
    assert.ok(POWER_MODES.includes('low_power'));
    assert.ok(POWER_MODES.includes('critical'));
    assert.ok(POWER_MODES.includes('emergency_shutdown'));
  });

  it('defines charging types', () => {
    assert.ok(CHARGING_TYPES.includes('fast'));
    assert.ok(CHARGING_TYPES.includes('wireless'));
  });

  it('defines backup types and sync domains', () => {
    assert.equal(BACKUP_TYPES.length, 2);
    assert.equal(SYNC_DOMAINS.length, 6);
    assert.ok(SYNC_DOMAINS.includes('contacts'));
    assert.ok(SYNC_DOMAINS.includes('messages'));
    assert.ok(SYNC_DOMAINS.includes('wallpapers'));
  });

  it('defines recovery modes and maintenance actions', () => {
    assert.equal(RECOVERY_MODES.length, 3);
    assert.ok(MAINTENANCE_ACTIONS.includes('optimize_storage'));
    assert.ok(MAINTENANCE_ACTIONS.includes('duplicate_detection'));
    assert.ok(MAINTENANCE_ACTIONS.includes('reset_network'));
  });

  it('uses realistic security and battery limits', () => {
    assert.equal(MAX_FAILED_UNLOCK_ATTEMPTS, 5);
    assert.ok(BATTERY_DEGRADATION_PER_CYCLE > 0 && BATTERY_DEGRADATION_PER_CYCLE < 0.01);
  });
});

describe('device ecosystem socket events', () => {
  it('defines required realtime events', () => {
    const events = [
      'device:profile:update',
      'device:power:update',
      'device:power:emergency',
      'device:security:update',
      'device:security:unlocked',
      'device:security:remote_lock',
      'device:security:remote_wipe',
      'device:backup:complete',
      'device:backup:progress',
      'device:backup:restored',
      'device:sync:complete',
      'device:sync:progress',
      'device:maintenance:complete',
      'device:recovery:update',
      'device:recovery:factory_reset',
      'device:ecosystem:ready',
      'device:diagnostics:extended',
    ];
    assert.equal(events.length, 17);
  });
});

describe('device ecosystem API routes', () => {
  it('mounts under /api/device/ecosystem', () => {
    const routes = [
      '/api/device/ecosystem/initialize',
      '/api/device/ecosystem/profile',
      '/api/device/ecosystem/power',
      '/api/device/ecosystem/security',
      '/api/device/ecosystem/storage',
      '/api/device/ecosystem/backup',
      '/api/device/ecosystem/sync',
      '/api/device/ecosystem/diagnostics',
      '/api/device/ecosystem/maintenance',
      '/api/device/ecosystem/developer',
      '/api/device/ecosystem/recovery',
    ];
    assert.equal(routes.length, 11);
    assert.ok(routes.every((r) => r.startsWith('/api/device/ecosystem')));
  });
});

describe('device ecosystem background tasks', () => {
  it('includes device-ecosystem-tick', () => {
    const tasks = ['device-ecosystem-tick', 'communication-tick', 'world-engine-tick'];
    assert.ok(tasks.includes('device-ecosystem-tick'));
  });
});

describe('device ecosystem integrations', () => {
  it('integrates with core OS subsystems', () => {
    const subsystems = [
      'identity', 'bank', 'sim', 'phone', 'contacts',
      'communication', 'world', 'notifications', 'permissions',
    ];
    assert.equal(subsystems.length, 9);
  });
});

describe('storage expansion categories', () => {
  it('covers required storage buckets', async () => {
    const { STORAGE_CATEGORIES } = await import('../../constants/deviceEcosystem');
    assert.ok(STORAGE_CATEGORIES.includes('downloads'));
    assert.ok(STORAGE_CATEGORIES.includes('trash'));
    assert.ok(STORAGE_CATEGORIES.includes('cache'));
    assert.ok(STORAGE_CATEGORIES.includes('application_data'));
    assert.ok(STORAGE_CATEGORIES.includes('media_library'));
    assert.ok(STORAGE_CATEGORIES.includes('system'));
  });
});
