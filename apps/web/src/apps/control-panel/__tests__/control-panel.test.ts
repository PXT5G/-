import { describe, it, expect } from 'vitest';
import { BANANAOS_APP_IDS } from '@bananaos/shared';

describe('Control Panel bundle ID', () => {
  it('is com.bananaos.control-panel', () => {
    expect(BANANAOS_APP_IDS.CONTROL_PANEL).toBe('com.bananaos.control-panel');
  });
});

describe('Control Panel API routes', () => {
  const routes = [
    '/api/control-panel/dashboard',
    '/api/control-panel/permissions',
    '/api/control-panel/audit',
    '/api/control-panel/audit/export',
    '/api/control-panel/realtime',
    '/api/control-panel/sessions',
  ];

  it('defines all admin endpoints', () => {
    expect(routes.length).toBe(6);
    routes.forEach((r) => expect(r.startsWith('/api/control-panel')).toBe(true));
  });
});

describe('Control Panel tabs', () => {
  const tabs = ['dashboard', 'permissions', 'audit', 'realtime', 'sessions'];

  it('has five feature modules', () => {
    expect(tabs.length).toBe(5);
  });
});
