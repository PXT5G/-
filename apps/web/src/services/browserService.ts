import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface BrowserInit {
  profile: Record<string, unknown>;
  permissions: string[];
  integrations: Record<string, boolean>;
  searchEngines: string[];
  defaultSearchEngine: string;
  session: { sessionId: string; incognito: boolean; activeTabId?: string };
  tabs: Record<string, unknown>[];
  quickLinks: { url: string; title: string; portalType: string }[];
}

export interface BrowserPage {
  siteId?: string;
  url?: string;
  title?: string;
  content?: string;
  readerContent?: string;
  portalType?: string;
  deepLink?: { appBundle?: string; nativeUrl?: string };
  httpsValid?: boolean;
  type?: string;
  query?: string;
  results?: Record<string, unknown>[];
}

export const browserService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<BrowserInit>>('/api/browser/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getHome(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/home', { token });
    return res.data!;
  },

  async listSites(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/sites', { token });
    return res.data!;
  },

  async navigate(token: string, body: { tabId: string; url: string }) {
    const res = await apiRequest<ApiResponse<{ tab: Record<string, unknown>; page: BrowserPage | null }>>('/api/browser/navigate', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async search(token: string, q: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/browser/search?q=${encodeURIComponent(q)}`, { token });
    return res.data!;
  },

  async searchSuggestions(token: string, q: string) {
    const res = await apiRequest<ApiResponse<{ history: string[]; sites: { url: string; title: string }[] }>>(
      `/api/browser/search/suggestions?q=${encodeURIComponent(q)}`, { token }
    );
    return res.data!;
  },

  async createSession(token: string, incognito: boolean) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/sessions', {
      method: 'POST', token, body: JSON.stringify({ incognito }),
    });
    return res.data!;
  },

  async listTabs(token: string, sessionId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/browser/tabs?sessionId=${sessionId}`, { token });
    return res.data!;
  },

  async createTab(token: string, sessionId: string, url?: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/tabs', {
      method: 'POST', token, body: JSON.stringify({ sessionId, url }),
    });
    return res.data!;
  },

  async updateTab(token: string, tabId: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/browser/tabs/${tabId}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async closeTab(token: string, tabId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/browser/tabs/${tabId}`, {
      method: 'DELETE', token,
    });
    return res.data!;
  },

  async listBookmarks(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/bookmarks', { token });
    return res.data!;
  },

  async addBookmark(token: string, body: { url: string; title: string; favorite?: boolean }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/bookmarks', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async listHistory(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/history', { token });
    return res.data!;
  },

  async clearHistory(token: string) {
    const res = await apiRequest<ApiResponse<{ cleared: boolean }>>('/api/browser/history', { method: 'DELETE', token });
    return res.data!;
  },

  async listDownloads(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/downloads', { token });
    return res.data!;
  },

  async startDownload(token: string, body: { url: string; filename: string; mimeType?: string; size?: number }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/downloads', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async controlDownload(token: string, downloadId: string, action: 'pause' | 'resume' | 'cancel') {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/browser/downloads/${downloadId}/control`, {
      method: 'POST', token, body: JSON.stringify({ action }),
    });
    return res.data!;
  },

  async addReadingList(token: string, body: { url: string; title: string; excerpt?: string }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/reading-list', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async listReadingList(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/reading-list', { token });
    return res.data!;
  },

  async saveOffline(token: string, body: { url: string; title: string; content: string }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/offline', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async translate(token: string, content: string, targetLang: string) {
    const res = await apiRequest<ApiResponse<{ translated: string }>>('/api/browser/translate', {
      method: 'POST', token, body: JSON.stringify({ content, targetLang }),
    });
    return res.data!;
  },

  async findInPage(token: string, content: string, query: string) {
    const res = await apiRequest<ApiResponse<{ matches: number; highlights: string }>>('/api/browser/find', {
      method: 'POST', token, body: JSON.stringify({ content, query }),
    });
    return res.data!;
  },

  async generateQr(token: string, url: string) {
    const res = await apiRequest<ApiResponse<{ dataUrl: string; payload: string }>>('/api/browser/qr/generate', {
      method: 'POST', token, body: JSON.stringify({ url }),
    });
    return res.data!;
  },

  async share(token: string, url: string, title: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/share', {
      method: 'POST', token, body: JSON.stringify({ url, title }),
    });
    return res.data!;
  },

  async updateProfile(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/profile', {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async setSitePermission(token: string, body: { origin: string; permission: string; granted: boolean }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/browser/permissions', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async listClosedTabs(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/browser/tabs/closed', { token });
    return res.data!;
  },
};
