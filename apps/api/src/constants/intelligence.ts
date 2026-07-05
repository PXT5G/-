/** GULF Intelligence Layer — predictions, suggestions, dashboards, search index */

export const INTELLIGENCE_APP_BUNDLE = 'com.gulfos.intelligence' as const;

export const PREDICTION_TYPES = [
  'app_usage', 'contact', 'location', 'business', 'stock', 'message', 'call',
  'meeting', 'route', 'download', 'file', 'widget', 'automation', 'shortcut', 'focus',
] as const;
export type PredictionType = (typeof PREDICTION_TYPES)[number];

export const SUGGESTION_TYPES = [
  'app', 'contact', 'action', 'shortcut', 'automation', 'focus', 'widget',
  'search', 'route', 'meeting', 'notification',
] as const;
export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export const DASHBOARD_TYPES = [
  'personal', 'business', 'bank', 'exchange', 'economy', 'government',
  'police', 'justice', 'ems', 'weather',
] as const;
export type DashboardType = (typeof DASHBOARD_TYPES)[number];

export const SEARCH_INDEX_TYPES = [
  'app', 'contact', 'call', 'message', 'mail', 'file', 'photo', 'video', 'note',
  'calendar', 'business', 'property', 'vehicle', 'aircraft', 'marine', 'stock',
  'setting', 'shortcut', 'automation', 'identity', 'bank_account',
] as const;
export type SearchIndexType = (typeof SEARCH_INDEX_TYPES)[number];

export const INTELLIGENCE_SOCKET_EVENTS = [
  'prediction:update', 'prediction:generated', 'dashboard:update', 'dashboard:widget',
  'search:index:update', 'notification:summary', 'suggestion:generated',
] as const;

export const VOICE_SESSION_STATUSES = ['idle', 'listening', 'processing', 'speaking', 'ended'] as const;
