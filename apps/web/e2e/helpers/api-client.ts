import type { APIRequestContext } from '@playwright/test';
import { DEMO_CREDENTIALS, GULFOS_APPS } from './app-catalog';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';

const GOV_APPS = ['com.gulfos.police', 'com.gulfos.justice', 'com.gulfos.ems'] as const;
const GOV_PERMS = ['location', 'camera', 'notifications', 'network', 'storage'] as const;

export interface DemoSession {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export async function ensureDemoUser(request: APIRequestContext): Promise<string> {
  const session = await prepareShowcaseEnvironment(request);
  return session.token;
}

export async function prepareShowcaseEnvironment(request: APIRequestContext): Promise<DemoSession> {
  await request.post(`${API_BASE}/api/auth/register`, {
    data: {
      username: DEMO_CREDENTIALS.username,
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
      displayName: 'مستخدم تجريبي',
    },
  }).catch(() => {});

  const login = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password },
  });
  const body = await login.json();
  const token = body?.data?.tokens?.accessToken as string;
  const user = body?.data?.user;
  if (!token || !user) {
    throw new Error(`Failed to obtain demo auth token: ${body?.error ?? login.status()}`);
  }

  await request.post(`${API_BASE}/api/system/ready`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});

  await installGovernmentApps(request, token);
  await installAllCatalogApps(request, token);

  for (const bundleId of GOV_APPS) {
    await request.post(`${API_BASE}/api/${bundleId.split('.').pop()}/initialize`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  return {
    token,
    user: {
      id: user.id ?? user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName ?? 'مستخدم تجريبي',
      role: user.role ?? 'user',
    },
  };
}

async function installGovernmentApps(request: APIRequestContext, token: string) {
  for (const bundleId of GOV_APPS) {
    await request.post(`${API_BASE}/api/apps/install/${bundleId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    }).catch(() => {});

    for (const permission of GOV_PERMS) {
      await request.post(`${API_BASE}/api/system/permissions/grant`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { appId: bundleId, permission },
      }).catch(() => {});
    }
  }
}

async function installAllCatalogApps(request: APIRequestContext, token: string) {
  const catalog = await request.get(`${API_BASE}/api/apps/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!catalog.ok()) return;

  const apps = (await catalog.json())?.data as { bundleId: string }[] | undefined;
  if (!apps) return;

  for (const app of apps) {
    await request.post(`${API_BASE}/api/apps/install/${app.bundleId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    }).catch(() => {});
  }

  for (const app of GULFOS_APPS) {
    await request.post(`${API_BASE}/api/apps/install/${app.bundleId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    }).catch(() => {});
  }
}

export async function installApp(
  request: APIRequestContext,
  token: string,
  bundleId: string,
): Promise<boolean> {
  const direct = await request.post(`${API_BASE}/api/apps/install/${bundleId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {},
  });
  if (direct.ok()) return true;

  const res = await request.post(`${API_BASE}/api/store/apps/${bundleId}/install`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { approvedPermissions: ['network', 'storage', 'notifications', 'location', 'camera'] },
  });
  if (!res.ok()) return false;
  const body = await res.json();
  const downloadId = body?.data?.downloadId as string | undefined;
  if (!downloadId) return false;

  const complete = await request.post(`${API_BASE}/api/store/downloads/${downloadId}/complete`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return complete.ok();
}

export async function uninstallApp(
  request: APIRequestContext,
  token: string,
  bundleId: string,
): Promise<boolean> {
  const res = await request.delete(`${API_BASE}/api/store/apps/${bundleId}/uninstall`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { keepUserData: false, keepSettings: false, keepSession: false },
  });
  return res.ok();
}
