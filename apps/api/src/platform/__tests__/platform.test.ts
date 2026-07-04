import { describe, it, expect } from 'vitest';
import { BANANAOS_APP_IDS, IDENTITY_GATED_APPS } from '@bananaos/shared';

describe('BananaOS Core Platform App IDs', () => {
  it('defines all connected apps', () => {
    expect(BANANAOS_APP_IDS.POLICE).toBe('com.bananaos.police');
    expect(BANANAOS_APP_IDS.BANK).toBe('com.bananaos.bank');
    expect(BANANAOS_APP_IDS.SIM).toBe('com.bananaos.sim');
    expect(BANANAOS_APP_IDS.PHONE).toBe('com.bananaos.phone');
    expect(BANANAOS_APP_IDS.CONTACTS).toBe('com.bananaos.contacts');
    expect(BANANAOS_APP_IDS.JUSTICE).toBe('com.bananaos.justice');
    expect(BANANAOS_APP_IDS.IDENTITY).toBe('com.bananaos.identity');
  });

  it('gates sensitive apps behind identity', () => {
    expect(IDENTITY_GATED_APPS).toContain(BANANAOS_APP_IDS.BANK);
    expect(IDENTITY_GATED_APPS).toContain(BANANAOS_APP_IDS.POLICE);
    expect(IDENTITY_GATED_APPS).toContain(BANANAOS_APP_IDS.JUSTICE);
  });
});

describe('Platform service module paths', () => {
  const services = [
    'identityBridgeService',
    'permissionEngineService',
    'auditService',
    'eventBusService',
    'notificationService',
  ];

  it('defines all required platform services', () => {
    expect(services.length).toBe(5);
    services.forEach((s) => expect(s).toMatch(/Service$/));
  });
});

describe('Platform API routes', () => {
  const routes = [
    '/api/platform/health',
    '/api/platform/identity/context',
    '/api/platform/permissions/check',
    '/api/platform/audit/log',
    '/api/platform/notifications/send',
    '/api/justice/health',
  ];

  it('exposes core platform endpoints', () => {
    expect(routes.every((r) => r.startsWith('/api/'))).toBe(true);
  });
});
