import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) return JSON.parse(raw)?.state?.tokens?.accessToken;
  } catch { /* ignore */ }
  return undefined;
}

export interface SimSnapshot {
  simId: string;
  slot: string;
  carrier: string;
  phoneNumber: string;
  networkGeneration: string;
  signalStrength: number;
  roaming: boolean;
  isPreferredVoice: boolean;
  isPreferredData: boolean;
  isPreferredSms: boolean;
  apn?: string;
}

export const simAppService = {
  async initialize() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<{ sims: SimSnapshot[] }>>('/api/sim/initialize', { method: 'POST', token });
    return res.data!;
  },

  async list() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<SimSnapshot[]>>('/api/sim', { token });
    return res.data!;
  },

  async update(simId: string, body: Partial<SimSnapshot>) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<SimSnapshot>>(`/api/sim/${simId}`, { method: 'PATCH', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async refresh() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<SimSnapshot[]>>('/api/sim/refresh', { method: 'POST', token });
    return res.data!;
  },
};
