import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface BankDashboard {
  totalBalance: number;
  accountCount: number;
  cardCount: number;
  activeCards: number;
  monthlySpending: number;
  accounts: BankAccount[];
  recentTransactions: BankTransaction[];
}

export interface BankAccount {
  accountId: string;
  accountType: string;
  accountNumber: string;
  iban: string;
  walletId: string;
  name: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
  isPrimary: boolean;
  isActive: boolean;
}

export interface BankCard {
  cardId: string;
  accountId: string;
  cardType: string;
  status: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  dailyLimit: number;
  monthlyLimit: number;
  isContactless: boolean;
  isVirtual: boolean;
}

export interface BankTransaction {
  transactionId: string;
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  balanceAfter: number;
  description: string;
  counterparty?: string;
  category?: string;
  createdAt: string;
}

export const bankService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/bank/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string): Promise<BankDashboard> {
    const res = await apiRequest<ApiResponse<BankDashboard>>('/api/bank/dashboard', { token });
    return res.data!;
  },

  async getAccounts(token: string): Promise<BankAccount[]> {
    const res = await apiRequest<ApiResponse<BankAccount[]>>('/api/bank/accounts', { token });
    return res.data!;
  },

  async getCards(token: string): Promise<BankCard[]> {
    const res = await apiRequest<ApiResponse<BankCard[]>>('/api/bank/cards', { token });
    return res.data!;
  },

  async freezeCard(token: string, cardId: string) {
    const res = await apiRequest<ApiResponse<BankCard>>(`/api/bank/cards/${cardId}/freeze`, { method: 'POST', token });
    return res.data!;
  },

  async unfreezeCard(token: string, cardId: string) {
    const res = await apiRequest<ApiResponse<BankCard>>(`/api/bank/cards/${cardId}/unfreeze`, { method: 'POST', token });
    return res.data!;
  },

  async getTransactions(token: string, params?: { accountId?: string; limit?: number; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const res = await apiRequest<ApiResponse<{ transactions: BankTransaction[]; total: number }>>(
      `/api/bank/transactions?${qs}`, { token }
    );
    return res.data!;
  },

  async internalTransfer(token: string, body: { fromAccountId: string; toAccountId: string; amount: number; description: string }) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/bank/transfers/internal', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async externalTransfer(token: string, body: { fromAccountId: string; toIban: string; amount: number; description: string }) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/bank/transfers/external', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getBudget(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/bank/budget', { token });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/bank/analytics', { token });
    return res.data!;
  },
};
