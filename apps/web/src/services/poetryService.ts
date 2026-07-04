import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export interface PoetryHomeFeed {
  featured: Record<string, unknown>[];
  latest: Record<string, unknown>[];
  popular: Record<string, unknown>[];
  daily: Record<string, unknown> | null;
  trending: Record<string, unknown>[];
  announcements: Record<string, unknown>[];
  categories: string[];
}

export interface PoetryInit {
  profile: Record<string, unknown>;
  permissions: string[];
  categories: string[];
}

export const poetryService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<PoetryInit>>('/api/poetry/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getHome(token: string): Promise<PoetryHomeFeed> {
    const res = await apiRequest<ApiResponse<PoetryHomeFeed>>('/api/poetry/home', { token });
    return res.data!;
  },

  async getRandom(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/random', { token });
    return res.data!;
  },

  async search(token: string, params: Record<string, string>) {
    const q = new URLSearchParams(params);
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/poetry/search?${q}`, { token });
    return res.data!;
  },

  async listPoems(token: string, params?: Record<string, string>) {
    const q = new URLSearchParams(params);
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/poetry/poems?${q}`, { token });
    return res.data!;
  },

  async getPoem(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/poetry/poems/${poemId}`, { token });
    return res.data!;
  },

  async createPoem(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/poems', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updatePoem(token: string, poemId: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/poetry/poems/${poemId}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async deletePoem(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<{ deleted: boolean }>>(`/api/poetry/poems/${poemId}`, {
      method: 'DELETE', token,
    });
    return res.data!;
  },

  async likePoem(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<{ liked: boolean; likeCount: number }>>(`/api/poetry/poems/${poemId}/like`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async getComments(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/poetry/poems/${poemId}/comments`, { token });
    return res.data!;
  },

  async addComment(token: string, poemId: string, body: string, parentId?: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/poetry/poems/${poemId}/comments`, {
      method: 'POST', token, body: JSON.stringify({ body, parentId }),
    });
    return res.data!;
  },

  async toggleBookmark(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<{ bookmarked: boolean }>>(`/api/poetry/poems/${poemId}/bookmark`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async toggleFavorite(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<{ favorited: boolean }>>(`/api/poetry/poems/${poemId}/favorite`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async sharePoem(token: string, poemId: string, channel = 'internal') {
    const res = await apiRequest<ApiResponse<{ shared: boolean; deepLink: string }>>(`/api/poetry/poems/${poemId}/share`, {
      method: 'POST', token, body: JSON.stringify({ channel }),
    });
    return res.data!;
  },

  async exportPdf(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<{ filename: string; content: string }>>(`/api/poetry/poems/${poemId}/export`, { token });
    return res.data!;
  },

  async getVersions(token: string, poemId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/poetry/poems/${poemId}/versions`, { token });
    return res.data!;
  },

  async getBookmarks(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/bookmarks', { token });
    return res.data!;
  },

  async getFavorites(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/favorites', { token });
    return res.data!;
  },

  async getHistory(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/history', { token });
    return res.data!;
  },

  async getProfile(token: string, userId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/poetry/profile/${userId}`, { token });
    return res.data!;
  },

  async updateProfile(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/profile', {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async follow(token: string, userId: string) {
    const res = await apiRequest<ApiResponse<{ following: boolean }>>(`/api/poetry/follow/${userId}`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async getVerifiedPoets(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/verified-poets', { token });
    return res.data!;
  },

  async getCollections(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/collections', { token });
    return res.data!;
  },

  async createCollection(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/collections', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getEvents(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/events', { token });
    return res.data!;
  },

  async getCompetitions(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/competitions', { token });
    return res.data!;
  },

  async getChallenges(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/challenges', { token });
    return res.data!;
  },

  async moderate(token: string, poemId: string, action: string, reason?: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/poetry/poems/${poemId}/moderate`, {
      method: 'POST', token, body: JSON.stringify({ action, reason }),
    });
    return res.data!;
  },

  async getModerationLogs(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/poetry/moderation/logs', { token });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/analytics', { token });
    return res.data!;
  },

  async getRbac(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/poetry/rbac', { token });
    return res.data!;
  },
};
