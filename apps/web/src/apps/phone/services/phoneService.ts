import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  PhoneDashboard,
  PhoneSettings,
  PhoneFavorite,
  PhoneBlocked,
  CallHistoryEntry,
  ActiveCallState,
  VoicemailEntry,
  EmergencyContact,
  ContactSearchResult,
} from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const phoneService = {
  async getPermissions(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; data: string[] }>('/api/phone/permissions', { token: getToken() });
    return res.data ?? [];
  },

  async init(): Promise<void> {
    await apiRequest('/api/phone/permissions/init', { method: 'POST', token: getToken() });
  },

  async getDashboard(): Promise<PhoneDashboard> {
    const res = await apiRequest<{ success: boolean; data: PhoneDashboard }>('/api/phone/dashboard', { token: getToken() });
    return res.data!;
  },

  async getSettings(): Promise<PhoneSettings> {
    const res = await apiRequest<{ success: boolean; data: PhoneSettings }>('/api/phone/settings', { token: getToken() });
    return res.data!;
  },

  async updateSettings(data: Partial<PhoneSettings>): Promise<PhoneSettings> {
    const res = await apiRequest<{ success: boolean; data: PhoneSettings }>('/api/phone/settings', {
      method: 'PATCH',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async getActiveCall(): Promise<ActiveCallState | null> {
    const res = await apiRequest<{ success: boolean; data: ActiveCallState | null }>('/api/phone/calls/active', { token: getToken() });
    return res.data ?? null;
  },

  async makeCall(phoneNumber: string, contactId?: string) {
    const res = await apiRequest<{ success: boolean; data: { call: { id: string }; activeCall: ActiveCallState } }>('/api/phone/calls', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ phoneNumber, contactId }),
    });
    return res.data!;
  },

  async acceptCall(callId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(`/api/phone/calls/${callId}/accept`, { method: 'POST', token: getToken() });
    return res.data;
  },

  async rejectCall(callId: string) {
    await apiRequest(`/api/phone/calls/${callId}/reject`, { method: 'POST', token: getToken() });
  },

  async endCall(callId: string) {
    await apiRequest(`/api/phone/calls/${callId}/end`, { method: 'POST', token: getToken() });
  },

  async holdCall(callId: string) {
    await apiRequest(`/api/phone/calls/${callId}/hold`, { method: 'POST', token: getToken() });
  },

  async resumeCall(callId: string) {
    await apiRequest(`/api/phone/calls/${callId}/resume`, { method: 'POST', token: getToken() });
  },

  async muteCall(callId: string, muted: boolean) {
    await apiRequest(`/api/phone/calls/${callId}/mute`, { method: 'POST', token: getToken(), body: JSON.stringify({ muted }) });
  },

  async speakerCall(callId: string, speaker: boolean) {
    await apiRequest(`/api/phone/calls/${callId}/speaker`, { method: 'POST', token: getToken(), body: JSON.stringify({ speaker }) });
  },

  async addConference(callId: string, phoneNumber: string, contactId?: string) {
    await apiRequest(`/api/phone/calls/${callId}/conference`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ phoneNumber, contactId }),
    });
  },

  async getHistory(params?: { direction?: string; status?: string; page?: number }) {
    const qs = new URLSearchParams();
    if (params?.direction) qs.set('direction', params.direction);
    if (params?.status) qs.set('status', params.status);
    if (params?.page !== undefined) qs.set('page', String(params.page));
    const res = await apiRequest<{ success: boolean; data: { items: CallHistoryEntry[]; total: number } }>(
      `/api/phone/calls/history?${qs}`,
      { token: getToken() }
    );
    return res.data!;
  },

  async getMissedCalls(): Promise<CallHistoryEntry[]> {
    const res = await apiRequest<{ success: boolean; data: CallHistoryEntry[] }>('/api/phone/calls/missed', { token: getToken() });
    return res.data ?? [];
  },

  async getFavorites(): Promise<PhoneFavorite[]> {
    const res = await apiRequest<{ success: boolean; data: PhoneFavorite[] }>('/api/phone/favorites', { token: getToken() });
    return res.data ?? [];
  },

  async addFavorite(data: { phoneNumber: string; label: string; contactId?: string }) {
    const res = await apiRequest<{ success: boolean; data: PhoneFavorite }>('/api/phone/favorites', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async removeFavorite(id: string) {
    await apiRequest(`/api/phone/favorites/${id}`, { method: 'DELETE', token: getToken() });
  },

  async getBlocked(): Promise<PhoneBlocked[]> {
    const res = await apiRequest<{ success: boolean; data: PhoneBlocked[] }>('/api/phone/blocked', { token: getToken() });
    return res.data ?? [];
  },

  async blockNumber(data: { phoneNumber: string; label?: string; reason?: string }) {
    const res = await apiRequest<{ success: boolean; data: PhoneBlocked }>('/api/phone/blocked', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async unblockNumber(id: string) {
    await apiRequest(`/api/phone/blocked/${id}`, { method: 'DELETE', token: getToken() });
  },

  async searchContacts(q: string): Promise<ContactSearchResult[]> {
    const res = await apiRequest<{ success: boolean; data: ContactSearchResult[] }>(
      `/api/phone/contacts/search?q=${encodeURIComponent(q)}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getVoicemails(page = 0) {
    const res = await apiRequest<{ success: boolean; data: { items: VoicemailEntry[]; unread: number } }>(
      `/api/phone/voicemail?page=${page}`,
      { token: getToken() }
    );
    return res.data!;
  },

  async markVoicemailRead(id: string) {
    await apiRequest(`/api/phone/voicemail/${id}/read`, { method: 'POST', token: getToken() });
  },

  async deleteVoicemail(id: string) {
    await apiRequest(`/api/phone/voicemail/${id}`, { method: 'DELETE', token: getToken() });
  },

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const res = await apiRequest<{ success: boolean; data: EmergencyContact[] }>('/api/phone/emergency', { token: getToken() });
    return res.data ?? [];
  },

  async emergencyCall() {
    const res = await apiRequest<{ success: boolean; data: { call: { id: string }; activeCall: ActiveCallState } }>(
      '/api/phone/emergency/call',
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },

  async callEmergencyContact(id: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(`/api/phone/emergency/${id}/call`, { method: 'POST', token: getToken() });
    return res.data;
  },
};
