import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  BankAccount,
  BankCard,
  Dashboard,
  Transaction,
  TransferResult,
  Analytics,
  BankNotification,
  BankSecurity,
  AdminStats,
} from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const bankService = {
  async provision(): Promise<BankAccount[]> {
    const res = await apiRequest<{ success: boolean; data: BankAccount[] }>('/api/bank/provision', {
      method: 'POST',
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getDashboard(): Promise<Dashboard> {
    const res = await apiRequest<{ success: boolean; data: Dashboard }>('/api/bank/dashboard', {
      token: getToken(),
    });
    return res.data!;
  },

  async getAccounts(): Promise<BankAccount[]> {
    const res = await apiRequest<{ success: boolean; data: BankAccount[] }>('/api/bank/accounts', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async updateAccount(id: string, alias: string): Promise<BankAccount> {
    const res = await apiRequest<{ success: boolean; data: BankAccount }>(`/api/bank/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ alias }),
      token: getToken(),
    });
    return res.data!;
  },

  async getCards(): Promise<BankCard[]> {
    const res = await apiRequest<{ success: boolean; data: BankCard[] }>('/api/bank/cards', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async freezeCard(id: string): Promise<void> {
    await apiRequest(`/api/bank/cards/${id}/freeze`, { method: 'POST', token: getToken() });
  },

  async unfreezeCard(id: string): Promise<void> {
    await apiRequest(`/api/bank/cards/${id}/unfreeze`, { method: 'POST', token: getToken() });
  },

  async updateCardLimits(id: string, limits: { dailyLimit?: number; monthlyLimit?: number }): Promise<void> {
    await apiRequest(`/api/bank/cards/${id}/limits`, {
      method: 'PATCH',
      body: JSON.stringify(limits),
      token: getToken(),
    });
  },

  async transfer(data: {
    fromAccountId: string;
    toAccountId?: string;
    toAccountNumber?: string;
    amount: number;
    reason?: string;
    category?: string;
  }): Promise<TransferResult> {
    const res = await apiRequest<{ success: boolean; data: TransferResult }>('/api/bank/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
      token: getToken(),
    });
    return res.data!;
  },

  async deposit(accountId: string, amount: number, method: 'cash' | 'manual' = 'manual'): Promise<void> {
    await apiRequest('/api/bank/deposit', {
      method: 'POST',
      body: JSON.stringify({ accountId, amount, method }),
      token: getToken(),
    });
  },

  async withdraw(accountId: string, amount: number): Promise<void> {
    await apiRequest('/api/bank/withdraw', {
      method: 'POST',
      body: JSON.stringify({ accountId, amount }),
      token: getToken(),
    });
  },

  async makePayment(data: {
    accountId: string;
    amount: number;
    type: string;
    recipient: string;
    description: string;
  }): Promise<void> {
    await apiRequest('/api/bank/payments', {
      method: 'POST',
      body: JSON.stringify(data),
      token: getToken(),
    });
  },

  async requestMoney(fromAccountNumber: string, amount: number, reason?: string): Promise<void> {
    await apiRequest('/api/bank/request-money', {
      method: 'POST',
      body: JSON.stringify({ fromAccountNumber, amount, reason }),
      token: getToken(),
    });
  },

  async getTransactions(params?: { status?: string; direction?: string; q?: string }): Promise<Transaction[]> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.direction) search.set('direction', params.direction);
    if (params?.q) search.set('q', params.q);
    const res = await apiRequest<{ success: boolean; data: Transaction[] }>(
      `/api/bank/transactions?${search}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async generateQr(accountId: string, amount?: number): Promise<{ payload: string; dataUrl: string }> {
    const res = await apiRequest<{ success: boolean; data: { payload: string; dataUrl: string } }>(
      '/api/bank/qr/generate',
      { method: 'POST', body: JSON.stringify({ accountId, amount }), token: getToken() }
    );
    return res.data!;
  },

  async scanQr(payload: string, fromAccountId: string): Promise<TransferResult> {
    const res = await apiRequest<{ success: boolean; data: TransferResult }>('/api/bank/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ payload, fromAccountId }),
      token: getToken(),
    });
    return res.data!;
  },

  async getAnalytics(period: 'month' | 'year' = 'month'): Promise<Analytics> {
    const res = await apiRequest<{ success: boolean; data: Analytics }>(
      `/api/bank/analytics?period=${period}`,
      { token: getToken() }
    );
    return res.data!;
  },

  async getSecurity(): Promise<BankSecurity> {
    const res = await apiRequest<{ success: boolean; data: BankSecurity }>('/api/bank/security', {
      token: getToken(),
    });
    return res.data!;
  },

  async updateSecurity(settings: Partial<BankSecurity>): Promise<void> {
    await apiRequest('/api/bank/security', {
      method: 'PATCH',
      body: JSON.stringify(settings),
      token: getToken(),
    });
  },

  async setPin(pin: string): Promise<void> {
    await apiRequest('/api/bank/security/pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      token: getToken(),
    });
  },

  async getNotifications(): Promise<BankNotification[]> {
    const res = await apiRequest<{ success: boolean; data: BankNotification[] }>(
      '/api/bank/notifications',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async exportCsv(): Promise<Blob> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/bank/export/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  async exportStatementPdf(accountId: string): Promise<Blob> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/bank/export/statement?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  // Admin
  async adminPendingTransfers() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      '/api/bank/admin/transfers/pending',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async adminApproveTransfer(id: string): Promise<void> {
    await apiRequest(`/api/bank/admin/transfers/${id}/approve`, { method: 'POST', token: getToken() });
  },

  async adminRejectTransfer(id: string): Promise<void> {
    await apiRequest(`/api/bank/admin/transfers/${id}/reject`, { method: 'POST', token: getToken() });
  },

  async adminStats(): Promise<AdminStats> {
    const res = await apiRequest<{ success: boolean; data: AdminStats }>(
      '/api/bank/admin/stats',
      { token: getToken() }
    );
    return res.data!;
  },

  async adminAuditLogs() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      '/api/bank/admin/audit',
      { token: getToken() }
    );
    return res.data ?? [];
  },
};
