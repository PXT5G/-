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

export interface PhoneCallSnapshot {
  callId: string;
  direction: string;
  status: string;
  callType: string;
  fromNumber: string;
  toNumber: string;
  contactName?: string;
  durationSeconds: number;
  isEmergency: boolean;
  startedAt?: string;
  endedAt?: string;
}

export const phoneAppService = {
  async initialize() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/phone/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getCalls(params?: { status?: string; search?: string }) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const q = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    const res = await apiRequest<ApiResponse<{ calls: PhoneCallSnapshot[]; total: number }>>(`/api/phone/calls${q}`, { token });
    return res.data!;
  },

  async initiateCall(body: { toNumber: string; contactId?: string; contactName?: string; callType?: string }) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<PhoneCallSnapshot>>('/api/phone/calls', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async answerCall(callId: string) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<PhoneCallSnapshot>>(`/api/phone/calls/${callId}/answer`, { method: 'PATCH', token });
    return res.data!;
  },

  async endCall(callId: string, status = 'ended') {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<PhoneCallSnapshot>>(`/api/phone/calls/${callId}/end`, { method: 'PATCH', token, body: JSON.stringify({ status }) });
    return res.data!;
  },

  async getFavorites() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<{ favoriteId: string; label: string; number: string; speedDialIndex?: number }[]>>('/api/phone/favorites', { token });
    return res.data!;
  },

  async getVoicemail() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/phone/voicemail', { token });
    return res.data!;
  },

  async getStatistics() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/phone/statistics', { token });
    return res.data!;
  },

  async getDirectory() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<{ number: string; label: string; category: string }[]>>('/api/phone/directory', { token });
    return res.data!;
  },
};
