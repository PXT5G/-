import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface IdentityProfile {
  identityId: string;
  status: string;
  role: string;
  fullName: string;
  nationalId: string;
  dateOfBirth?: string;
  nationality: string;
  gender?: string;
  photoUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  verifiedAt?: string;
  policeStatus?: string;
  justiceStatus?: string;
  hasQrCode: boolean;
  hasNfc: boolean;
}

export interface IdentityDocument {
  documentId: string;
  identityId: string;
  documentType: string;
  documentNumber: string;
  title: string;
  description?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  isVerified: boolean;
}

export const identityService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/identity/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getProfile(token: string): Promise<IdentityProfile> {
    const res = await apiRequest<ApiResponse<IdentityProfile>>('/api/identity/profile', { token });
    return res.data!;
  },

  async updateProfile(token: string, body: Partial<IdentityProfile>) {
    const res = await apiRequest<ApiResponse<IdentityProfile>>('/api/identity/profile', {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDocuments(token: string, type?: string): Promise<IdentityDocument[]> {
    const qs = type ? `?type=${type}` : '';
    const res = await apiRequest<ApiResponse<IdentityDocument[]>>(`/api/identity/documents${qs}`, { token });
    return res.data!;
  },

  async addDocument(token: string, body: { documentType: string; documentNumber: string; title: string; description?: string }) {
    const res = await apiRequest<ApiResponse<IdentityDocument>>('/api/identity/documents', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getEmergencyInfo(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/identity/emergency', { token });
    return res.data!;
  },

  async generateQr(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/identity/qr/generate', { method: 'POST', token });
    return res.data!;
  },

  async exportVCard(token: string) {
    const res = await apiRequest<ApiResponse<{ vcard: string; filename: string }>>('/api/identity/export/vcard', { token });
    return res.data!;
  },
};
