import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const securityAppService = {
  async initialize(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/security/initialize', { method: 'POST', token }).then((r) => r.data!);
  },
  async dashboard(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/security/dashboard', { token }).then((r) => r.data!);
  },
};

export const privacyAppService = {
  async dashboard(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/privacy/dashboard', { token }).then((r) => r.data!);
  },
};

export const cloudAppService = {
  async listBackups(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/cloud/backups', { token }).then((r) => r.data!);
  },
  async createBackup(token: string, backupType = 'manual') {
    return apiRequest<ApiResponse<unknown>>('/api/cloud/backups', { method: 'POST', token, body: JSON.stringify({ backupType }) }).then((r) => r.data!);
  },
  async restoreBackup(token: string, backupId: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/cloud/backups/${backupId}/restore`, { method: 'POST', token }).then((r) => r.data!);
  },
  async sync(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/cloud/sync', { method: 'POST', token }).then((r) => r.data!);
  },
};

export const findMyAppService = {
  async listDevices(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/find-my/devices', { token }).then((r) => r.data!);
  },
  async registerDevice(token: string, deviceType: string, deviceName: string) {
    return apiRequest<ApiResponse<unknown>>('/api/find-my/devices', { method: 'POST', token, body: JSON.stringify({ deviceType, deviceName }) }).then((r) => r.data!);
  },
  async markLost(token: string, deviceId: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/find-my/devices/${deviceId}/lost`, { method: 'POST', token }).then((r) => r.data!);
  },
};

export const updatesAppService = {
  async check(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/updates/check', { token }).then((r) => r.data!);
  },
};

export const developerAppService = {
  async dashboard(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/developer/dashboard', { token }).then((r) => r.data!);
  },
};

export const analyticsAppService = {
  async center(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/analytics/center', { token }).then((r) => r.data!);
  },
};

export const diagnosticsAppService = {
  async center(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/diagnostics/center', { token }).then((r) => r.data!);
  },
};

export const enterpriseAppService = {
  async listOrgs(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/enterprise/orgs', { token }).then((r) => r.data!);
  },
  async createOrg(token: string, name: string) {
    return apiRequest<ApiResponse<unknown>>('/api/enterprise/orgs', { method: 'POST', token, body: JSON.stringify({ name }) }).then((r) => r.data!);
  },
};
