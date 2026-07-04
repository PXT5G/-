import { apiRequest } from '@/utils/api';
import type {
  DeviceProfileSnapshot,
  PowerStateSnapshot,
  SecurityConfigSnapshot,
  BackupSnapshot,
  SyncStatusSnapshot,
  RecoveryStateSnapshot,
  MaintenanceRecordSnapshot,
  ExtendedDiagnosticsReport,
} from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.accessToken;
    }
  } catch { /* ignore */ }
  return undefined;
}

export const deviceEcosystemService = {
  async initialize(deviceName?: string): Promise<{ ready: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { ready: boolean } }>(
      '/api/device/ecosystem/initialize',
      { method: 'POST', body: JSON.stringify({ deviceName }), token }
    );
    return res.data!;
  },

  async getProfile(): Promise<DeviceProfileSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceProfileSnapshot }>(
      '/api/device/ecosystem/profile',
      { token }
    );
    return res.data!;
  },

  async updateProfile(updates: Partial<{ deviceName: string; region: string; language: string; timezone: string }>): Promise<DeviceProfileSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceProfileSnapshot }>(
      '/api/device/ecosystem/profile',
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },

  async getPower(): Promise<PowerStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PowerStateSnapshot }>(
      '/api/device/ecosystem/power',
      { token }
    );
    return res.data!;
  },

  async setCharging(charging: boolean, chargingType?: string): Promise<PowerStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PowerStateSnapshot }>(
      '/api/device/ecosystem/power/charging',
      { method: 'POST', body: JSON.stringify({ charging, chargingType }), token }
    );
    return res.data!;
  },

  async setPowerMode(mode: string): Promise<PowerStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PowerStateSnapshot }>(
      '/api/device/ecosystem/power/mode',
      { method: 'PATCH', body: JSON.stringify({ mode }), token }
    );
    return res.data!;
  },

  async getSecurity(): Promise<SecurityConfigSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: SecurityConfigSnapshot }>(
      '/api/device/ecosystem/security',
      { token }
    );
    return res.data!;
  },

  async updateSecurity(updates: Partial<SecurityConfigSnapshot>): Promise<SecurityConfigSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: SecurityConfigSnapshot }>(
      '/api/device/ecosystem/security',
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },

  async unlock(method: string, credential: string): Promise<{ unlocked: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { unlocked: boolean } }>(
      '/api/device/ecosystem/security/unlock',
      { method: 'POST', body: JSON.stringify({ method, credential }), token }
    );
    return res.data!;
  },

  async createBackup(): Promise<BackupSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BackupSnapshot }>(
      '/api/device/ecosystem/backup',
      { method: 'POST', body: JSON.stringify({ backupType: 'manual' }), token }
    );
    return res.data!;
  },

  async getBackups(): Promise<BackupSnapshot[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BackupSnapshot[] }>(
      '/api/device/ecosystem/backup',
      { token }
    );
    return res.data ?? [];
  },

  async restoreBackup(backupId: string): Promise<{ restored: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { restored: boolean } }>(
      `/api/device/ecosystem/backup/${backupId}/restore`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async startSync(sourceDeviceId: string, targetDeviceId: string, domains?: string[]): Promise<{ syncId: string }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { syncId: string } }>(
      '/api/device/ecosystem/sync',
      { method: 'POST', body: JSON.stringify({ sourceDeviceId, targetDeviceId, domains }), token }
    );
    return res.data!;
  },

  async getSyncStatus(): Promise<SyncStatusSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: SyncStatusSnapshot }>(
      '/api/device/ecosystem/sync/status',
      { token }
    );
    return res.data!;
  },

  async runMaintenance(action: string): Promise<{ action: string; status: string }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { action: string; status: string } }>(
      '/api/device/ecosystem/maintenance',
      { method: 'POST', body: JSON.stringify({ action }), token }
    );
    return res.data!;
  },

  async getMaintenanceHistory(): Promise<MaintenanceRecordSnapshot[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: MaintenanceRecordSnapshot[] }>(
      '/api/device/ecosystem/maintenance',
      { token }
    );
    return res.data ?? [];
  },

  async collectDiagnostics(): Promise<ExtendedDiagnosticsReport> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: ExtendedDiagnosticsReport }>(
      '/api/device/ecosystem/diagnostics',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getRecovery(): Promise<{ recovery: RecoveryStateSnapshot; availableBackups: BackupSnapshot[] }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { recovery: RecoveryStateSnapshot; availableBackups: BackupSnapshot[] } }>(
      '/api/device/ecosystem/recovery',
      { token }
    );
    return res.data!;
  },

  async setRecoveryMode(mode: string): Promise<RecoveryStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: RecoveryStateSnapshot }>(
      '/api/device/ecosystem/recovery/mode',
      { method: 'PATCH', body: JSON.stringify({ mode }), token }
    );
    return res.data!;
  },

  async factoryReset(confirmPhrase: string): Promise<{ reset: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { reset: boolean } }>(
      '/api/device/ecosystem/recovery/factory-reset',
      { method: 'POST', body: JSON.stringify({ confirmPhrase }), token }
    );
    return res.data!;
  },

  async getDeveloperDashboard(): Promise<Record<string, unknown>> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Record<string, unknown> }>(
      '/api/device/ecosystem/developer',
      { token }
    );
    return res.data!;
  },

  async detectDuplicates(): Promise<{ duplicateGroups: number; totalWasted: number }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { duplicateGroups: number; totalWasted: number } }>(
      '/api/device/ecosystem/storage/duplicates',
      { token }
    );
    return res.data!;
  },

  async storageCleanup(): Promise<{ bytesFreed: number }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { bytesFreed: number } }>(
      '/api/device/ecosystem/storage/cleanup',
      { method: 'POST', token }
    );
    return res.data!;
  },
};
