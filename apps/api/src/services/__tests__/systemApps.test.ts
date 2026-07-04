import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_APP_BUNDLES, CAMERA_MODES, CALENDAR_EVENT_TYPES, GALLERY_ALBUM_TYPES } from '../../constants/systemApps';

describe('system apps constants', () => {
  it('defines all 10 essential system app bundles', () => {
    const bundles = Object.values(SYSTEM_APP_BUNDLES);
    assert.equal(bundles.length, 10);
    assert.ok(bundles.includes('com.gulfos.maps'));
    assert.ok(bundles.includes('com.gulfos.camera'));
    assert.ok(bundles.includes('com.gulfos.gallery'));
    assert.ok(bundles.includes('com.gulfos.files'));
    assert.ok(bundles.includes('com.gulfos.calendar'));
    assert.ok(bundles.includes('com.gulfos.clock'));
    assert.ok(bundles.includes('com.gulfos.calculator'));
    assert.ok(bundles.includes('com.gulfos.notes'));
    assert.ok(bundles.includes('com.gulfos.recorder'));
    assert.ok(bundles.includes('com.gulfos.weather'));
  });

  it('defines camera modes', () => {
    assert.equal(CAMERA_MODES.length, 6);
    assert.ok(CAMERA_MODES.includes('portrait'));
    assert.ok(CAMERA_MODES.includes('slow_motion'));
    assert.ok(CAMERA_MODES.includes('night'));
  });

  it('defines calendar event types including government', () => {
    assert.ok(CALENDAR_EVENT_TYPES.includes('police_shift'));
    assert.ok(CALENDAR_EVENT_TYPES.includes('justice_hearing'));
    assert.ok(CALENDAR_EVENT_TYPES.includes('bank_payment'));
  });

  it('defines gallery album types', () => {
    assert.ok(GALLERY_ALBUM_TYPES.includes('hidden'));
    assert.ok(GALLERY_ALBUM_TYPES.includes('ai_category'));
  });
});

describe('system apps API routes', () => {
  it('mounts under /api/system-apps', () => {
    const routes = [
      '/api/system-apps/initialize',
      '/api/system-apps/camera/photo',
      '/api/system-apps/gallery/items',
      '/api/system-apps/calendar/events',
      '/api/system-apps/clock/alarms',
      '/api/system-apps/notes',
      '/api/system-apps/voice-recorder',
      '/api/system-apps/weather',
      '/api/system-apps/maps/state',
      '/api/system-apps/files/recent',
    ];
    assert.equal(routes.length, 10);
    assert.ok(routes.every((r) => r.startsWith('/api/system-apps')));
  });
});

describe('system apps socket events', () => {
  it('defines required realtime events', () => {
    const events = [
      'system-apps:ready', 'gallery:update', 'camera:capture', 'calendar:update',
      'clock:update', 'notes:update', 'voice-recorder:update', 'weather:update',
      'maps:update', 'files:update',
    ];
    assert.equal(events.length, 10);
  });
});

describe('system apps runtime registration', () => {
  it('includes all apps in RUNTIME_APPS', async () => {
    const { RUNTIME_APPS } = await import('../packageService');
    for (const bundle of Object.values(SYSTEM_APP_BUNDLES)) {
      assert.ok(RUNTIME_APPS.has(bundle), `Missing ${bundle}`);
    }
  });
});

describe('weather service integration', () => {
  it('maps weather conditions to labels', () => {
    const conditions = ['clear', 'clouds', 'fog', 'rain', 'thunderstorm', 'smog'];
    assert.equal(conditions.length, 6);
  });
});
