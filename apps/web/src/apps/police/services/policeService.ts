import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  PoliceOfficer,
  PoliceDashboard,
  PoliceDispatch,
  PoliceCase,
  PoliceReport,
  PoliceVehicle,
  MdtPersonResult,
  PoliceProperty,
  PoliceEvidence,
  PoliceChatMessage,
  RankHistoryEntry,
  PoliceAuditEntry,
  AdminStats,
  OfficerStatus,
  PoliceRank,
} from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const policeService = {
  async getPermissions(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; data: string[] }>('/api/police/permissions', { token: getToken() });
    return res.data ?? [];
  },

  async getMe(): Promise<PoliceOfficer | null> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer | null }>('/api/police/me', { token: getToken() });
    return res.data ?? null;
  },

  async provision(data?: { firstName?: string; lastName?: string; rank?: PoliceRank }): Promise<PoliceOfficer> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer }>('/api/police/provision', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data ?? {}),
    });
    return res.data!;
  },

  async getDashboard(): Promise<PoliceDashboard> {
    const res = await apiRequest<{ success: boolean; data: PoliceDashboard }>('/api/police/dashboard', { token: getToken() });
    return res.data!;
  },

  async mdtSearchPersons(q: string): Promise<MdtPersonResult> {
    const res = await apiRequest<{ success: boolean; data: MdtPersonResult }>(`/api/police/mdt/persons?q=${encodeURIComponent(q)}`, { token: getToken() });
    return res.data!;
  },

  async mdtSearchVehicles(q: string): Promise<PoliceVehicle[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceVehicle[] }>(`/api/police/mdt/vehicles?q=${encodeURIComponent(q)}`, { token: getToken() });
    return res.data ?? [];
  },

  async mdtSearchProperties(q: string): Promise<PoliceProperty[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceProperty[] }>(`/api/police/mdt/properties?q=${encodeURIComponent(q)}`, { token: getToken() });
    return res.data ?? [];
  },

  async mdtCaseLookup(q: string): Promise<PoliceCase[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceCase[] }>(`/api/police/mdt/cases?q=${encodeURIComponent(q)}`, { token: getToken() });
    return res.data ?? [];
  },

  async getAuditLogs(limit = 50): Promise<PoliceAuditEntry[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceAuditEntry[] }>(`/api/police/audit/logs?limit=${limit}`, { token: getToken() });
    return res.data ?? [];
  },

  async listReports(page = 0, limit = 20): Promise<PoliceReport[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceReport[] }>(`/api/police/reports?page=${page}&limit=${limit}`, { token: getToken() });
    return res.data ?? [];
  },

  async createReport(data: { title: string; description: string; location: string; type?: string; involvedParties?: string[] }): Promise<{ id: string; reportNumber: string }> {
    const res = await apiRequest<{ success: boolean; data: { id: string; reportNumber: string } }>('/api/police/reports', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async reviewReport(id: string, approve: boolean, note?: string): Promise<void> {
    await apiRequest(`/api/police/reports/${id}/review`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ approve, note }),
    });
  },

  async listOfficers(page = 0, limit = 20): Promise<PoliceOfficer[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer[] }>(`/api/police/officers?page=${page}&limit=${limit}`, { token: getToken() });
    return res.data ?? [];
  },

  async updateStatus(officerId: string, status: OfficerStatus): Promise<PoliceOfficer> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer }>(`/api/police/officers/${officerId}/status`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ status }),
    });
    return res.data!;
  },

  async addPoints(officerId: string, points: number, reason: string): Promise<PoliceOfficer> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer }>(`/api/police/officers/${officerId}/points`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ points, reason }),
    });
    return res.data!;
  },

  async promote(officerId: string, rank: PoliceRank, reason: string): Promise<PoliceOfficer> {
    const res = await apiRequest<{ success: boolean; data: PoliceOfficer }>(`/api/police/officers/${officerId}/promote`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ rank, reason }),
    });
    return res.data!;
  },

  async getRankHistory(officerId: string): Promise<RankHistoryEntry[]> {
    const res = await apiRequest<{ success: boolean; data: RankHistoryEntry[] }>(`/api/police/officers/${officerId}/rank-history`, { token: getToken() });
    return res.data ?? [];
  },

  async listDispatches(page = 0, limit = 20, status?: string): Promise<PoliceDispatch[]> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const res = await apiRequest<{ success: boolean; data: PoliceDispatch[] }>(`/api/police/dispatch?${qs}`, { token: getToken() });
    return res.data ?? [];
  },

  async createDispatch(data: { type: string; description: string; location: string; priority?: number }): Promise<{ id: string; dispatchNumber: string }> {
    const res = await apiRequest<{ success: boolean; data: { id: string; dispatchNumber: string } }>('/api/police/dispatch', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async assignDispatch(id: string, officerIds: string[]): Promise<void> {
    await apiRequest(`/api/police/dispatch/${id}/assign`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ officerIds }),
    });
  },

  async updateDispatchStatus(id: string, status: string): Promise<void> {
    await apiRequest(`/api/police/dispatch/${id}/status`, {
      method: 'PATCH',
      token: getToken(),
      body: JSON.stringify({ status }),
    });
  },

  async listCases(page = 0, limit = 20, status?: string): Promise<PoliceCase[]> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const res = await apiRequest<{ success: boolean; data: PoliceCase[] }>(`/api/police/cases?${qs}`, { token: getToken() });
    return res.data ?? [];
  },

  async createCase(data: { title: string; description: string; location?: string; priority?: number }): Promise<{ id: string; caseNumber: string }> {
    const res = await apiRequest<{ success: boolean; data: { id: string; caseNumber: string } }>('/api/police/cases', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async getCaseEvidence(caseId: string): Promise<PoliceEvidence[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceEvidence[] }>(`/api/police/cases/${caseId}/evidence`, { token: getToken() });
    return res.data ?? [];
  },

  async addEvidence(data: { title: string; description?: string; type?: string; caseId?: string; fileUrl?: string }): Promise<void> {
    await apiRequest('/api/police/evidence', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
  },

  async searchVehicles(q: string, page = 0): Promise<PoliceVehicle[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceVehicle[] }>(`/api/police/vehicles/search?q=${encodeURIComponent(q)}&page=${page}`, { token: getToken() });
    return res.data ?? [];
  },

  async registerVehicle(data: { plateNumber: string; make: string; model: string; year: number; color: string; ownerName: string }): Promise<void> {
    await apiRequest('/api/police/vehicles', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
  },

  async getChat(channel: string, page = 0): Promise<PoliceChatMessage[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceChatMessage[] }>(`/api/police/chat?channel=${encodeURIComponent(channel)}&page=${page}`, { token: getToken() });
    return res.data ?? [];
  },

  async sendChat(channel: string, message: string): Promise<void> {
    await apiRequest('/api/police/chat', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ channel, message }),
    });
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await apiRequest<{ success: boolean; data: AdminStats }>('/api/police/admin/stats', { token: getToken() });
    return res.data!;
  },

  async getAdminAudit(limit = 100): Promise<PoliceAuditEntry[]> {
    const res = await apiRequest<{ success: boolean; data: PoliceAuditEntry[] }>(`/api/police/admin/audit?limit=${limit}`, { token: getToken() });
    return res.data ?? [];
  },
};
