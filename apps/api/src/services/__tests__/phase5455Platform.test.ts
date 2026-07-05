import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PERSONALIZATION_APP_BUNDLE, PERSONALIZATION_SOCKET_EVENTS } from '../../constants/personalization';
import {
  SECURITY_APP_BUNDLE, CLOUD_APP_BUNDLE, FIND_MY_APP_BUNDLE,
  PRIVACY_APP_BUNDLE, DEVELOPER_APP_BUNDLE, ANALYTICS_APP_BUNDLE,
  ENTERPRISE_APP_BUNDLE, PHASE55_SOCKET_EVENTS,
} from '../../constants/phase55';

describe('personalization constants', () => {
  it('defines personalization bundle', () => assert.equal(PERSONALIZATION_APP_BUNDLE, 'com.gulfos.personalization'));
  it('defines socket events', () => assert.ok(PERSONALIZATION_SOCKET_EVENTS.includes('theme:update')));
});

describe('phase 5.5 constants', () => {
  it('defines security bundle', () => assert.equal(SECURITY_APP_BUNDLE, 'com.gulfos.security'));
  it('defines cloud bundle', () => assert.equal(CLOUD_APP_BUNDLE, 'com.gulfos.cloud'));
  it('defines find-my bundle', () => assert.equal(FIND_MY_APP_BUNDLE, 'com.gulfos.find-my'));
  it('defines privacy bundle', () => assert.equal(PRIVACY_APP_BUNDLE, 'com.gulfos.privacy'));
  it('defines developer bundle', () => assert.equal(DEVELOPER_APP_BUNDLE, 'com.gulfos.developer'));
  it('defines analytics bundle', () => assert.equal(ANALYTICS_APP_BUNDLE, 'com.gulfos.analytics'));
  it('defines enterprise bundle', () => assert.equal(ENTERPRISE_APP_BUNDLE, 'com.gulfos.enterprise'));
  it('defines socket events', () => assert.ok(PHASE55_SOCKET_EVENTS.includes('security:alert')));
});

describe('phase 5.4/5.5 routes', () => {
  it('mounts personalization routes', async () => {
    const routes = await import('../../api/routes/personalization');
    assert.ok(routes.default);
  });
  it('mounts security routes', async () => {
    const routes = await import('../../api/routes/security');
    assert.ok(routes.default);
  });
  it('mounts cloud routes', async () => {
    const routes = await import('../../api/routes/cloud');
    assert.ok(routes.default);
  });
  it('mounts find-my routes', async () => {
    const routes = await import('../../api/routes/findMy');
    assert.ok(routes.default);
  });
  it('mounts enterprise routes', async () => {
    const routes = await import('../../api/routes/enterprise');
    assert.ok(routes.default);
  });
});
