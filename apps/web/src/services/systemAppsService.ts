import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';

async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error('Authentication required');
  const res = await apiRequest<{ success: boolean; data: T }>(path, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    token,
  });
  return res.data!;
}

export const systemAppsService = {
  initialize: () => api<{ ready: boolean }>('/api/system-apps/initialize', { method: 'POST' }),

  // Camera
  getCameraSettings: () => api<Record<string, unknown>>('/api/system-apps/camera/settings'),
  capturePhoto: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/camera/photo', { method: 'POST', body: params }),
  captureVideo: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/camera/video', { method: 'POST', body: params }),
  getCameraRoll: () => api<Array<Record<string, unknown>>>('/api/system-apps/camera/roll'),

  // Gallery
  getGalleryItems: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<Array<Record<string, unknown>>>(`/api/system-apps/gallery/items${qs}`);
  },
  getGalleryAlbums: () => api<Array<Record<string, unknown>>>('/api/system-apps/gallery/albums'),
  toggleFavorite: (itemId: string) => api<Record<string, unknown>>(`/api/system-apps/gallery/items/${itemId}/favorite`, { method: 'POST' }),
  trashItem: (itemId: string) => api<Record<string, unknown>>(`/api/system-apps/gallery/items/${itemId}/trash`, { method: 'POST' }),
  getAiCategories: () => api<Array<{ name: string; count: number }>>('/api/system-apps/gallery/ai-categories'),
  getMemoryTimeline: () => api<Array<{ month: string; count: number }>>('/api/system-apps/gallery/timeline'),
  getGalleryStorage: () => api<Record<string, number>>('/api/system-apps/gallery/storage'),

  // Calendar
  getEvents: () => api<Array<Record<string, unknown>>>('/api/system-apps/calendar/events'),
  createEvent: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/calendar/events', { method: 'POST', body: params }),
  deleteEvent: (eventId: string) => api<{ deleted: boolean }>(`/api/system-apps/calendar/events/${eventId}`, { method: 'DELETE' }),
  seedCalendar: () => api<Array<Record<string, unknown>>>('/api/system-apps/calendar/seed', { method: 'POST' }),

  // Clock
  getAlarms: () => api<Array<Record<string, unknown>>>('/api/system-apps/clock/alarms'),
  createAlarm: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/clock/alarms', { method: 'POST', body: params }),
  toggleAlarm: (alarmId: string) => api<Record<string, unknown>>(`/api/system-apps/clock/alarms/${alarmId}/toggle`, { method: 'PATCH' }),
  getWorldClocks: () => api<Array<{ city: string; timezone: string; offset: number }>>('/api/system-apps/clock/world-clocks'),
  setSleepSchedule: (start: string, end: string) => api<Record<string, unknown>>('/api/system-apps/clock/sleep-schedule', { method: 'POST', body: { start, end } }),

  // Notes
  getNotes: (q?: string) => api<Array<Record<string, unknown>>>(`/api/system-apps/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createNote: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/notes', { method: 'POST', body: params }),
  updateNote: (noteId: string, params: Record<string, unknown>) => api<Record<string, unknown>>(`/api/system-apps/notes/${noteId}`, { method: 'PATCH', body: params }),
  deleteNote: (noteId: string) => api<{ deleted: boolean }>(`/api/system-apps/notes/${noteId}`, { method: 'DELETE' }),

  // Voice Recorder
  getRecordings: () => api<Array<Record<string, unknown>>>('/api/system-apps/voice-recorder'),
  createRecording: (params: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/voice-recorder', { method: 'POST', body: params }),
  deleteRecording: (id: string) => api<{ deleted: boolean }>(`/api/system-apps/voice-recorder/${id}`, { method: 'DELETE' }),

  // Weather
  getWeather: () => api<Record<string, unknown>>('/api/system-apps/weather'),

  // Maps
  getMapsState: () => api<Record<string, unknown>>('/api/system-apps/maps/state'),
  searchMaps: (q: string) => api<Array<Record<string, unknown>>>(`/api/system-apps/maps/search?q=${encodeURIComponent(q)}`),
  planRoute: (dest: Record<string, unknown>) => api<Record<string, unknown>>('/api/system-apps/maps/route', { method: 'POST', body: dest }),
  stopRoute: () => api<Record<string, unknown>>('/api/system-apps/maps/route/stop', { method: 'POST' }),
  getRoadBlocks: () => api<Record<string, unknown>>('/api/system-apps/maps/roadblocks'),
  downloadOfflineMap: (district: string) => api<Record<string, unknown>>('/api/system-apps/maps/offline', { method: 'POST', body: { district } }),
  getOfflineMaps: () => api<Array<Record<string, unknown>>>('/api/system-apps/maps/offline'),
  getDistricts: () => api<Array<{ name: string; terrain: string }>>('/api/system-apps/maps/districts'),

  // Files
  searchFiles: (q: string) => api<Array<Record<string, unknown>>>(`/api/system-apps/files/search?q=${encodeURIComponent(q)}`),
  getRecentFiles: () => api<Array<Record<string, unknown>>>('/api/system-apps/files/recent'),
  getFilesByCategory: (category: string) => api<Array<Record<string, unknown>>>(`/api/system-apps/files/category/${category}`),
  previewFile: (fileId: string) => api<Record<string, unknown>>(`/api/system-apps/files/${fileId}/preview`),
  initFolders: () => api<{ initialized: boolean }>('/api/system-apps/files/init-folders', { method: 'POST' }),
};
