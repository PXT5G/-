import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface BusinessDashboard {
  company: Record<string, unknown>;
  employee: Record<string, unknown> | null;
  stats: Record<string, number>;
  bank: Record<string, unknown>;
  analytics: Record<string, unknown> | null;
  permissions: string[];
}

export const businessService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/business/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getCompanies(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/business/companies', { token });
    return res.data!;
  },

  async createCompany(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/business/companies', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDashboard(token: string, companyId: string): Promise<BusinessDashboard> {
    const res = await apiRequest<ApiResponse<BusinessDashboard>>(`/api/business/dashboard?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getAnalytics(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/business/analytics?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getReports(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/business/reports?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getEmployees(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/employees?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getInventory(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/inventory?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getRevenue(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/revenue?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getExpenses(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/expenses?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getPayroll(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/payroll?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getCustomers(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/customers?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getSuppliers(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/suppliers?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getBranches(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/business/branches?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getBank(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/business/bank?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getSettings(token: string, companyId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/business/settings?companyId=${companyId}`, { token });
    return res.data!;
  },

  async getCategories(token: string) {
    const res = await apiRequest<ApiResponse<string[]>>('/api/business/categories', { token });
    return res.data!;
  },

  async recordAttendance(token: string, companyId: string, type: 'check_in' | 'check_out') {
    const res = await apiRequest<ApiResponse<unknown>>('/api/business/employees/attendance', {
      method: 'POST', token, body: JSON.stringify({ companyId, type }),
    });
    return res.data!;
  },
};
