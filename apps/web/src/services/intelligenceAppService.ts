import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const intelligenceAppService = {
  async initialize(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/intelligence/initialize', { method: 'POST', token }).then((r) => r.data!);
  },
  async getPredictions(token: string, generate = false) {
    return apiRequest<ApiResponse<unknown[]>>(`/api/intelligence/predictions${generate ? '?generate=true' : ''}`, { token }).then((r) => r.data!);
  },
  async getSuggestions(token: string, generate = false) {
    return apiRequest<ApiResponse<unknown[]>>(`/api/intelligence/suggestions${generate ? '?generate=true' : ''}`, { token }).then((r) => r.data!);
  },
  async search(token: string, q: string) {
    return apiRequest<ApiResponse<unknown[]>>(`/api/intelligence/search?q=${encodeURIComponent(q)}`, { token }).then((r) => r.data!);
  },
  async getDashboards(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/intelligence/dashboards', { token }).then((r) => r.data!);
  },
  async refreshDashboard(token: string, id: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/intelligence/dashboards/${id}/refresh`, { method: 'POST', token }).then((r) => r.data!);
  },
  async startVoice(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/intelligence/voice/start', { method: 'POST', token }).then((r) => r.data!);
  },
  async voiceCommand(token: string, sessionId: string, transcript: string) {
    return apiRequest<ApiResponse<unknown>>('/api/intelligence/voice/command', {
      method: 'POST', token, body: JSON.stringify({ sessionId, transcript }),
    }).then((r) => r.data!);
  },
};
