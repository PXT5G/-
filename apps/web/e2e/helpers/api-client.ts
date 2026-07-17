import type { APIRequestContext } from '@playwright/test';
import { execSync } from 'child_process';
import { DEMO_CREDENTIALS, GULFOS_APPS } from './app-catalog';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';

const GOV_APPS = ['com.gulfos.police', 'com.gulfos.justice', 'com.gulfos.ems'] as const;
/** Full system permission set (mirrors shared PermissionType) */
const ALL_PERMS = [
  'camera', 'microphone', 'location', 'contacts', 'photos', 'videos',
  'notifications', 'storage', 'network', 'biometrics', 'phone', 'bluetooth',
  'sim', 'files', 'calendar', 'sms', 'background_refresh', 'motion',
  'clipboard', 'nearby_devices', 'media_library', 'vpn', 'health',
  'bank', 'identity', 'mail',
] as const;

const INIT_SERVICES = [
  'police', 'justice', 'ems', 'poetry', 'browser', 'chat', 'business',
  'real-estate', 'vehicles', 'aviation', 'marine', 'exchange', 'sim',
  'phone', 'messages', 'contacts', 'mail', 'bank', 'identity',
  'assistant', 'automation', 'shortcuts', 'focus', 'intelligence',
  'personalization', 'security', 'communication', 'phone-os', 'premium-experience',
] as const;

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

  // Grant permissions before any service initialization so phone/contacts/
  // bank init never hits PHONE_PERMISSION_DENIED on a fresh database.
  await installGovernmentApps(request, token);
  await installAllCatalogApps(request, token);
  await grantAllAppPermissions(request, token);

  await request.post(`${API_BASE}/api/system/ready`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});

  for (const service of INIT_SERVICES) {
    await request.post(`${API_BASE}/api/${service}/initialize`, {
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
  }
}

async function grantAllAppPermissions(request: APIRequestContext, token: string) {
  const bundleIds = new Set<string>([...GOV_APPS, ...GULFOS_APPS.map((a) => a.bundleId)]);

  const catalog = await request.get(`${API_BASE}/api/apps/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (catalog.ok()) {
    const apps = (await catalog.json())?.data as { bundleId: string }[] | undefined;
    apps?.forEach((a) => bundleIds.add(a.bundleId));
  }

  for (const bundleId of bundleIds) {
    await Promise.all(
      ALL_PERMS.map((permission) =>
        request.post(`${API_BASE}/api/system/permissions/grant`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { appId: bundleId, permission },
        }).catch(() => {}),
      ),
    );
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

/** Stage an app so the Store Updates tab shows an available update. */
export async function stageAppForUpdate(
  request: APIRequestContext,
  token: string,
  bundleId: string,
  installedVersion = '0.1.0',
): Promise<void> {
  const me = await request.get(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!me.ok()) return;
  const userId = (await me.json())?.data?.id ?? (await me.json())?.data?._id;
  if (!userId) return;

  try {
    execSync(
      `mongosh --quiet bananaos --eval 'db.installedapps.updateOne({userId: ObjectId("${userId}"), bundleId: "${bundleId}"}, {$set: {installedVersion: "${installedVersion}"}})' 2>/dev/null || ` +
        `mongosh --quiet gulfos --eval 'db.installedapps.updateOne({userId: ObjectId("${userId}"), bundleId: "${bundleId}"}, {$set: {installedVersion: "${installedVersion}"}})' 2>/dev/null || true`,
      { stdio: 'ignore' },
    );
  } catch { /* optional staging */ }
}

/** Prepare store UI demos: leave target app uninstalled for install flow. */
export async function stageStoreDemoApps(
  request: APIRequestContext,
  token: string,
  installTarget = 'com.gulfos.poetry',
): Promise<void> {
  await uninstallApp(request, token, installTarget);
  const check = await request.get(`${API_BASE}/api/store/apps/${installTarget}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (check.ok()) {
    const installed = (await check.json())?.data?.installed;
    if (installed) {
      throw new Error(`Failed to stage store demo: ${installTarget} still installed`);
    }
  }
}
