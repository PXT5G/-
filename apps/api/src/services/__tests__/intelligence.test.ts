import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSISTANT_APP_BUNDLE,
  ASSISTANT_PERMISSIONS,
  ACTION_TYPES,
  ASSISTANT_SOCKET_EVENTS,
} from '../../constants/assistant';
import {
  AUTOMATION_APP_BUNDLE,
  TRIGGER_TYPES,
  ACTION_TYPES as AUTO_ACTION_TYPES,
  AUTOMATION_SOCKET_EVENTS,
} from '../../constants/automation';

describe('assistant constants', () => {
  it('defines assistant bundle', () => {
    assert.equal(ASSISTANT_APP_BUNDLE, 'com.gulfos.assistant');
  });
  it('defines permissions and actions', () => {
    assert.ok(ASSISTANT_PERMISSIONS.includes('search.global'));
    assert.ok(ACTION_TYPES.includes('open_app'));
    assert.ok(ASSISTANT_SOCKET_EVENTS.includes('assistant:thinking'));
  });
});

describe('automation constants', () => {
  it('defines automation bundle', () => {
    assert.equal(AUTOMATION_APP_BUNDLE, 'com.gulfos.automation');
  });
  it('defines triggers and actions', () => {
    assert.ok(TRIGGER_TYPES.includes('charging'));
    assert.ok(AUTO_ACTION_TYPES.includes('open_app'));
    assert.ok(AUTOMATION_SOCKET_EVENTS.includes('automation:running'));
  });
});

describe('intelligence routes', () => {
  it('mounts assistant routes', async () => {
    const routes = await import('../../api/routes/assistant');
    assert.ok(routes.default);
  });
  it('mounts automation routes', async () => {
    const routes = await import('../../api/routes/automation');
    assert.ok(routes.default);
  });
});
