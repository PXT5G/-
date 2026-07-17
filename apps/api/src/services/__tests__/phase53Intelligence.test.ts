import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUTS_APP_BUNDLE, SHORTCUT_ACTION_TYPES, SHORTCUT_SOCKET_EVENTS } from '../../constants/shortcuts';
import { FOCUS_APP_BUNDLE, FOCUS_PROFILE_TYPES, FOCUS_SOCKET_EVENTS } from '../../constants/focus';
import { INTELLIGENCE_APP_BUNDLE, PREDICTION_TYPES, INTELLIGENCE_SOCKET_EVENTS } from '../../constants/intelligence';

describe('shortcuts constants', () => {
  it('defines shortcuts bundle', () => assert.equal(SHORTCUTS_APP_BUNDLE, 'com.gulfos.shortcuts'));
  it('defines action types', () => assert.ok(SHORTCUT_ACTION_TYPES.includes('open_app')));
  it('defines socket events', () => assert.ok(SHORTCUT_SOCKET_EVENTS.includes('shortcut:run')));
});

describe('focus constants', () => {
  it('defines focus bundle', () => assert.equal(FOCUS_APP_BUNDLE, 'com.gulfos.focus'));
  it('defines profile types', () => assert.ok(FOCUS_PROFILE_TYPES.includes('work')));
  it('defines socket events', () => assert.ok(FOCUS_SOCKET_EVENTS.includes('focus:enabled')));
});

describe('intelligence constants', () => {
  it('defines intelligence bundle', () => assert.equal(INTELLIGENCE_APP_BUNDLE, 'com.gulfos.intelligence'));
  it('defines prediction types', () => assert.ok(PREDICTION_TYPES.includes('app_usage')));
  it('defines socket events', () => assert.ok(INTELLIGENCE_SOCKET_EVENTS.includes('prediction:generated')));
});

describe('phase 5.3 routes', () => {
  it('mounts shortcuts routes', async () => {
    const routes = await import('../../api/routes/shortcuts');
    assert.ok(routes.default);
  });
  it('mounts focus routes', async () => {
    const routes = await import('../../api/routes/focus');
    assert.ok(routes.default);
  });
  it('mounts intelligence routes', async () => {
    const routes = await import('../../api/routes/intelligence');
    assert.ok(routes.default);
  });
});
