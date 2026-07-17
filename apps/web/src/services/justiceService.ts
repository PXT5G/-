import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface JusticeDashboard {
  official: Record<string, unknown>;
  stats: Record<string, number>;
  upcomingHearings: Record<string, unknown>[];
  recentCases: Record<string, unknown>[];
  permissions: string[];
}

export const justiceService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string): Promise<JusticeDashboard> {
    const res = await apiRequest<ApiResponse<JusticeDashboard>>('/api/justice/dashboard', { token });
    return res.data!;
  },

  async updateStatus(token: string, status: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/status', {
      method: 'PATCH', token, body: JSON.stringify({ status }),
    });
    return res.data!;
  },

  async getCases(token: string, status?: string) {
    const q = status ? `?status=${status}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/cases${q}`, { token });
    return res.data!;
  },

  async getCase(token: string, caseId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/cases/${caseId}`, { token });
    return res.data!;
  },

  async createCase(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/cases', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updateCase(token: string, caseId: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/cases/${caseId}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getHearings(token: string, status?: string) {
    const q = status ? `?status=${status}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/hearings${q}`, { token });
    return res.data!;
  },

  async scheduleHearing(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/hearings', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updateHearing(token: string, hearingId: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/hearings/${hearingId}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getTrials(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/trials', { token });
    return res.data!;
  },

  async getOfficials(token: string, role?: string) {
    const q = role ? `?role=${role}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/officials${q}`, { token });
    return res.data!;
  },

  async getCourtrooms(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/courtrooms', { token });
    return res.data!;
  },

  async getEvidence(token: string, caseId?: string) {
    const q = caseId ? `?caseId=${caseId}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/evidence${q}`, { token });
    return res.data!;
  },

  async getWarrants(token: string, status?: string) {
    const q = status ? `?status=${status}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/warrants${q}`, { token });
    return res.data!;
  },

  async reviewWarrant(token: string, warrantReviewId: string, approved: boolean, denialReason?: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/warrants/${warrantReviewId}/review`, {
      method: 'PATCH', token, body: JSON.stringify({ approved, denialReason }),
    });
    return res.data!;
  },

  async getAppeals(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/appeals', { token });
    return res.data!;
  },

  async getContestedCitations(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/citations/contested', { token });
    return res.data!;
  },

  async resolveCitation(token: string, citationId: string, resolution: string, reducedAmount?: number) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/citations/${citationId}/resolve`, {
      method: 'PATCH', token, body: JSON.stringify({ resolution, reducedAmount }),
    });
    return res.data!;
  },

  async getLaws(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/laws', { token });
    return res.data!;
  },

  async getDocket(token: string, date?: string) {
    const q = date ? `?date=${date}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/docket${q}`, { token });
    return res.data!;
  },

  async search(token: string, searchType: string, query: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/search', {
      method: 'POST', token, body: JSON.stringify({ searchType, query }),
    });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/analytics', { token });
    return res.data!;
  },

  async issueSentence(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/sentences', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async issueJudgment(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/judgments', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getSentences(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/sentences', { token });
    return res.data!;
  },

  async getNotes(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/notes', { token });
    return res.data!;
  },

  async createNote(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/notes', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDocuments(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/documents', { token });
    return res.data!;
  },

  async createDocument(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/documents', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getAuditLog(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/justice/audit-log', { token });
    return res.data!;
  },

  async scheduleHearingFor(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/justice/hearings', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async reviseDocument(token: string, id: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/justice/documents/${id}/revise`, {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDocumentVersions(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/justice/documents/${id}/versions`, { token });
    return res.data!;
  },
};
