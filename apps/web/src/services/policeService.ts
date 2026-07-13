import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface PoliceDashboard {
  officer: Record<string, unknown>;
  stats: Record<string, number>;
  location: Record<string, unknown> | null;
  recentDispatches: Record<string, unknown>[];
  permissions: string[];
}

export const policeService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string): Promise<PoliceDashboard> {
    const res = await apiRequest<ApiResponse<PoliceDashboard>>('/api/police/dashboard', { token });
    return res.data!;
  },

  async getOfficers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/officers', { token });
    return res.data!;
  },

  async getUnits(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/units', { token });
    return res.data!;
  },

  async updateStatus(token: string, status: string, coords?: { latitude?: number; longitude?: number; district?: string }) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/status', {
      method: 'PATCH', token, body: JSON.stringify({ status, ...coords }),
    });
    return res.data!;
  },

  async getDispatches(token: string, params?: { is911?: boolean; status?: string }) {
    const q = new URLSearchParams();
    if (params?.is911) q.set('is911', 'true');
    if (params?.status) q.set('status', params.status);
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/police/dispatches?${q}`, { token });
    return res.data!;
  },

  async createDispatch(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/dispatches', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updateDispatch(token: string, id: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/police/dispatches/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getBolos(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/bolos', { token });
    return res.data!;
  },

  async createBolo(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/bolos', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getWarrants(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/warrants', { token });
    return res.data!;
  },

  async getWanted(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/wanted', { token });
    return res.data!;
  },

  async getReports(token: string, type?: string) {
    const q = type ? `?type=${type}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/police/reports${q}`, { token });
    return res.data!;
  },

  async createReport(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/reports', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async createCitation(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/citations', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getCases(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/cases', { token });
    return res.data!;
  },

  async getEvidence(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/evidence', { token });
    return res.data!;
  },

  async createEvidence(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/evidence', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async transferEvidence(token: string, id: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/police/evidence/${id}/custody`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getCitations(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/citations', { token });
    return res.data!;
  },

  async getNotes(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/notes', { token });
    return res.data!;
  },

  async createNote(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/notes', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async createCase(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/cases', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async createWarrant(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/warrants', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getPanics(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/panics', { token });
    return res.data!;
  },

  async getAuditLog(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/police/audit-log', { token });
    return res.data!;
  },

  async search(token: string, searchType: string, query: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/search', {
      method: 'POST', token, body: JSON.stringify({ searchType, query }),
    });
    return res.data!;
  },

  async triggerPanic(token: string, coords?: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/panic', {
      method: 'POST', token, body: JSON.stringify(coords ?? {}),
    });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/analytics', { token });
    return res.data!;
  },

  async track(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/police/track', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getFineCalculator(token: string, violationCode: string) {
    const res = await apiRequest<ApiResponse<{ fine: number; jailDays: number }>>(
      `/api/police/fine-calculator?violationCode=${encodeURIComponent(violationCode)}`, { token }
    );
    return res.data!;
  },
};
