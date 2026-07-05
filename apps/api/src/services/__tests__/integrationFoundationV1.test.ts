import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_AUTH_HEADER, IDEMPOTENCY_HEADER } from '../../constants/serviceAuth';

describe('integration foundation V1 constants', () => {
  it('defines service auth header', () => assert.equal(SERVICE_AUTH_HEADER, 'x-service-token'));
  it('defines idempotency header', () => assert.equal(IDEMPOTENCY_HEADER, 'idempotency-key'));
});

describe('service auth service', () => {
  it('exports verify and config helpers', async () => {
    const svc = await import('../serviceAuthService');
    assert.equal(typeof svc.verifyServiceToken, 'function');
    assert.equal(typeof svc.isServiceAuthConfigured, 'function');
  });

  it('rejects missing token when configured', async () => {
    const svc = await import('../serviceAuthService');
    if (svc.isServiceAuthConfigured()) {
      assert.equal(svc.verifyServiceToken(undefined), false);
      assert.equal(svc.verifyServiceToken('invalid-token-value'), false);
    } else {
      assert.equal(svc.verifyServiceToken(undefined), false);
    }
  });
});

describe('token encryption service', () => {
  it('round-trips when encryption key configured', async () => {
    const enc = await import('../tokenEncryptionService');
    if (!enc.isTokenEncryptionConfigured()) {
      assert.throws(() => enc.encryptSecret('test'), /TOKEN_ENCRYPTION_NOT_CONFIGURED/);
      return;
    }
    const cipher = enc.encryptSecret('integration-secret');
    assert.notEqual(cipher, 'integration-secret');
    assert.equal(enc.decryptSecret(cipher), 'integration-secret');
  });
});

describe('notification provider registry', () => {
  it('registers default socket and event_bus providers', async () => {
    const { clearNotificationProviders, listNotificationProviders } = await import('../notificationProviderRegistry');
    const { registerDefaultNotificationProviders } = await import('../notificationProviders/defaultProviders');
    clearNotificationProviders();
    registerDefaultNotificationProviders();
    const providers = listNotificationProviders();
    assert.ok(providers.some((p) => p.id === 'socket'));
    assert.ok(providers.some((p) => p.id === 'event_bus'));
    clearNotificationProviders();
  });
});

describe('health service', () => {
  it('collects system health report', async () => {
    const { collectSystemHealth } = await import('../healthService');
    const report = await collectSystemHealth();
    assert.ok(['healthy', 'degraded', 'down'].includes(report.status));
    assert.ok(report.integration);
    assert.equal(typeof report.uptime, 'number');
  });
});

describe('internal routes', () => {
  it('mounts internal API routes', async () => {
    const routes = await import('../../api/routes/internal');
    assert.ok(routes.default);
  });
});

describe('idempotency model', () => {
  it('exports IdempotencyRecord model', async () => {
    const { IdempotencyRecord } = await import('../../database/models/IdempotencyRecord');
    assert.ok(IdempotencyRecord);
  });
});
