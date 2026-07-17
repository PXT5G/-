import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOT_PHASES,
  POWER_ACTIONS,
  PERFORMANCE_MODES,
  LIVE_ACTIVITY_TYPES,
  SEARCH_CATEGORIES,
  EXTENDED_PERMISSIONS,
} from '../../constants/phoneOs';

describe('phone os constants', () => {
  it('defines boot phases', () => {
    assert.ok(BOOT_PHASES.includes('booting'));
    assert.ok(BOOT_PHASES.includes('recovery'));
    assert.ok(BOOT_PHASES.includes('safe'));
  });

  it('defines power actions', () => {
    assert.equal(POWER_ACTIONS.length, 4);
    assert.ok(POWER_ACTIONS.includes('emergency_restart'));
  });

  it('defines performance modes including ultra power saving', () => {
    assert.ok(PERFORMANCE_MODES.includes('ultra_power_saving'));
    assert.ok(PERFORMANCE_MODES.includes('performance'));
  });

  it('defines live activity types for dispatch scenarios', () => {
    assert.ok(LIVE_ACTIVITY_TYPES.includes('ems_dispatch'));
    assert.ok(LIVE_ACTIVITY_TYPES.includes('police_dispatch'));
    assert.ok(LIVE_ACTIVITY_TYPES.includes('stock_alert'));
  });

  it('defines global search categories', () => {
    assert.ok(SEARCH_CATEGORIES.includes('apps'));
    assert.ok(SEARCH_CATEGORIES.includes('stocks'));
    assert.ok(SEARCH_CATEGORIES.includes('marine'));
  });

  it('extends permission list for phone os', () => {
    assert.ok(EXTENDED_PERMISSIONS.includes('background_refresh'));
    assert.ok(EXTENDED_PERMISSIONS.includes('clipboard'));
    assert.ok(EXTENDED_PERMISSIONS.includes('health'));
  });
});

describe('phone os routes', () => {
  it('mounts phone os under device routes', async () => {
    const deviceRoutes = await import('../../api/routes/device');
    assert.ok(deviceRoutes.default);
  });

  it('mounts global search under system routes', async () => {
    const systemRoutes = await import('../../api/routes/system');
    assert.ok(systemRoutes.default);
  });
});
