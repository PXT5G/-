import type { APIRequestContext } from '@playwright/test';
import { DEMO_CREDENTIALS } from './app-catalog';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';

export async function ensureDemoUser(request: APIRequestContext): Promise<string> {
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
  if (!token) throw new Error('Failed to obtain demo auth token');

  await request.post(`${API_BASE}/api/system/ready`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});

  return token;
}

export async function installApp(
  request: APIRequestContext,
  token: string,
  bundleId: string,
): Promise<boolean> {
  const res = await request.post(`${API_BASE}/api/store/apps/${bundleId}/install`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { approvedPermissions: ['network', 'storage', 'notifications'] },
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
