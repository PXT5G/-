import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const exchangeService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/dashboard', { token });
    return res.data!;
  },

  async getStocks(token: string, params?: Record<string, string | number>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/exchange/stocks?${q}`, { token });
    return res.data!;
  },

  async getStock(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/exchange/stocks/${id}`, { token });
    return res.data!;
  },

  async search(token: string, query: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/exchange/search?q=${encodeURIComponent(query)}`, { token });
    return res.data!;
  },

  async getPortfolio(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/portfolio', { token });
    return res.data!;
  },

  async getOrders(token: string, status?: string) {
    const q = status ? `?status=${status}` : '';
    const res = await apiRequest<ApiResponse<{ items: unknown[] }>>(`/api/exchange/orders${q}`, { token });
    return res.data!;
  },

  async createOrder(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/orders', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async cancelOrder(token: string, orderId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/exchange/orders/${orderId}`, { method: 'DELETE', token });
    return res.data!;
  },

  async getTrades(token: string) {
    const res = await apiRequest<ApiResponse<{ items: unknown[] }>>('/api/exchange/trades', { token });
    return res.data!;
  },

  async getIndexes(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/exchange/indexes', { token });
    return res.data!;
  },

  async getNews(token: string, category?: string) {
    const q = category ? `?category=${category}` : '';
    const res = await apiRequest<ApiResponse<{ items: unknown[] }>>(`/api/exchange/news${q}`, { token });
    return res.data!;
  },

  async getWatchlist(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/watchlist', { token });
    return res.data!;
  },

  async updateWatchlist(token: string, tickers: string[]) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/watchlist', {
      method: 'PUT', token, body: JSON.stringify({ tickers }),
    });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/exchange/analytics', { token });
    return res.data!;
  },
};
