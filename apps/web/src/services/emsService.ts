import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface EmsDashboard {
  personnel: Record<string, unknown>;
  stats: Record<string, number>;
  location: Record<string, unknown> | null;
  recentDispatches: Record<string, unknown>[];
  hospitalCapacity: Record<string, unknown>[];
  permissions: string[];
}

export const emsService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string): Promise<EmsDashboard> {
    const res = await apiRequest<ApiResponse<EmsDashboard>>('/api/ems/dashboard', { token });
    return res.data!;
  },

  async updateStatus(token: string, status: string, coords?: { latitude?: number; longitude?: number; district?: string }) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/status', {
      method: 'PATCH', token, body: JSON.stringify({ status, ...coords }),
    });
    return res.data!;
  },

  async getUnits(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/units', { token });
    return res.data!;
  },

  async updateUnitGps(token: string, unitId: string, body: Record<string, number>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/units/${unitId}/gps`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDispatches(token: string, params?: { is911?: boolean; status?: string }) {
    const q = new URLSearchParams();
    if (params?.is911) q.set('is911', 'true');
    if (params?.status) q.set('status', params.status);
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/ems/dispatches?${q}`, { token });
    return res.data!;
  },

  async createDispatch(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/dispatches', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updateDispatch(token: string, id: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/dispatches/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async assignAmbulance(token: string, dispatchId: string, unitId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/dispatches/${dispatchId}/assign`, {
      method: 'POST', token, body: JSON.stringify({ unitId }),
    });
    return res.data!;
  },

  async routeHospital(token: string, dispatchId: string, hospitalId?: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/dispatches/${dispatchId}/route`, {
      method: 'POST', token, body: JSON.stringify({ hospitalId }),
    });
    return res.data!;
  },

  async dispatchHelicopter(token: string, dispatchId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/dispatches/${dispatchId}/helicopter`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async getPatients(token: string, status?: string) {
    const q = status ? `?status=${status}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/ems/patients${q}`, { token });
    return res.data!;
  },

  async getPatient(token: string, patientId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/patients/${patientId}`, { token });
    return res.data!;
  },

  async createPatient(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/patients', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getHospitals(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/hospitals', { token });
    return res.data!;
  },

  async getHospital(token: string, hospitalId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/hospitals/${hospitalId}`, { token });
    return res.data!;
  },

  async admitPatient(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/admissions', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getAmbulances(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/ambulances', { token });
    return res.data!;
  },

  async getIncidents(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/incidents', { token });
    return res.data!;
  },

  async getPersonnel(token: string, role?: string) {
    const q = role ? `?role=${role}` : '';
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/ems/personnel${q}`, { token });
    return res.data!;
  },

  async search(token: string, searchType: string, query: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/search', {
      method: 'POST', token, body: JSON.stringify({ searchType, query }),
    });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/analytics', { token });
    return res.data!;
  },

  async createIncident(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/incidents', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getRecords(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/records/all', { token });
    return res.data!;
  },

  async getTreatments(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/treatments', { token });
    return res.data!;
  },

  async getNotes(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/notes', { token });
    return res.data!;
  },

  async createNote(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/notes', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async createPatientRecord(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/patients', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async broadcastAlert(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/alert', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getAuditLog(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/audit-log', { token });
    return res.data!;
  },

  async getShifts(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/ems/shifts', { token });
    return res.data!;
  },

  async createShift(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/ems/shifts', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async clockShift(token: string, id: string, action: 'start' | 'end') {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/shifts/${id}/clock`, {
      method: 'PATCH', token, body: JSON.stringify({ action }),
    });
    return res.data!;
  },

  async updateEquipment(token: string, id: string, body: { add?: string; remove?: string }) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/ems/ambulances/${id}/equipment`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },
};
