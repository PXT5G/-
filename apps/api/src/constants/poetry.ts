/** GULF Poetry — com.gulfos.poetry constants */

export const POETRY_APP_BUNDLE = 'com.gulfos.poetry' as const;

export const POETRY_ROLES = [
  'server_poet',
  'poet',
  'assistant_poet',
  'publisher',
  'moderator',
  'viewer',
] as const;

export type PoetryRole = (typeof POETRY_ROLES)[number];

export const POETRY_CATEGORIES = [
  'national',
  'pride',
  'military',
  'police',
  'justice',
  'love',
  'sadness',
  'wisdom',
  'religion',
  'occasions',
  'events',
  'server_story',
  'roleplay',
  'custom',
] as const;

export type PoetryCategory = (typeof POETRY_CATEGORIES)[number];

export const POEM_STATUSES = [
  'draft',
  'scheduled',
  'published',
  'archived',
  'hidden',
  'rejected',
  'pending_review',
] as const;

export type PoemStatus = (typeof POEM_STATUSES)[number];

export const MODERATION_ACTIONS = [
  'approve',
  'reject',
  'hide',
  'feature',
  'pin',
  'archive',
  'delete',
] as const;

export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const EVENT_TYPES = ['reading', 'competition', 'workshop', 'ceremony', 'open_mic'] as const;
export const EVENT_STATUSES = ['upcoming', 'active', 'completed', 'cancelled'] as const;
export const COMPETITION_STATUSES = ['draft', 'open', 'judging', 'closed'] as const;
export const CHALLENGE_STATUSES = ['active', 'completed', 'cancelled'] as const;

export const POETRY_PERMISSIONS = [
  'poetry.access',
  'home.view',
  'poems.view',
  'poems.view.drafts',
  'poems.create',
  'poems.edit',
  'poems.delete',
  'poems.publish',
  'poems.schedule',
  'poems.feature',
  'poems.pin',
  'poems.archive',
  'poems.moderate',
  'poems.approve',
  'poems.reject',
  'poems.hide',
  'comments.view',
  'comments.create',
  'comments.moderate',
  'likes.create',
  'bookmarks.manage',
  'favorites.manage',
  'shares.create',
  'collections.view',
  'collections.create',
  'collections.manage',
  'profiles.view',
  'profiles.edit',
  'profiles.verify',
  'follow.manage',
  'search.use',
  'history.view',
  'events.view',
  'events.manage',
  'competitions.manage',
  'challenges.manage',
  'announcements.broadcast',
  'audio.upload',
  'video.upload',
  'images.upload',
  'pdf.export',
  'analytics.view',
  'audit.view',
  'rbac.configure',
  'daily.poem.manage',
  'trending.manage',
  'voice.record',
] as const;

export type PoetryPermission = (typeof POETRY_PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<PoetryRole, PoetryPermission[]> = {
  server_poet: [...POETRY_PERMISSIONS],
  poet: POETRY_PERMISSIONS.filter((p) =>
    !['poems.moderate', 'poems.approve', 'poems.reject', 'poems.hide', 'poems.feature', 'poems.pin',
      'comments.moderate', 'profiles.verify', 'events.manage', 'competitions.manage', 'challenges.manage',
      'announcements.broadcast', 'analytics.view', 'audit.view', 'rbac.configure', 'daily.poem.manage',
      'trending.manage'].includes(p)
  ),
  assistant_poet: POETRY_PERMISSIONS.filter((p) =>
    ['poetry.access', 'home.view', 'poems.view', 'poems.view.drafts', 'poems.create', 'poems.edit',
      'poems.publish', 'poems.schedule', 'comments.view', 'comments.create', 'likes.create',
      'bookmarks.manage', 'favorites.manage', 'shares.create', 'collections.view', 'collections.create',
      'collections.manage', 'profiles.view', 'profiles.edit', 'follow.manage', 'search.use', 'history.view',
      'events.view', 'audio.upload', 'video.upload', 'images.upload', 'pdf.export', 'voice.record'].includes(p)
  ),
  publisher: POETRY_PERMISSIONS.filter((p) =>
    !['poems.moderate', 'poems.approve', 'poems.reject', 'comments.moderate', 'profiles.verify',
      'competitions.manage', 'challenges.manage', 'rbac.configure', 'audit.view'].includes(p)
  ),
  moderator: POETRY_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'profiles.verify', 'announcements.broadcast', 'daily.poem.manage',
      'trending.manage', 'competitions.manage', 'challenges.manage', 'events.manage'].includes(p)
  ),
  viewer: [
    'poetry.access', 'home.view', 'poems.view', 'comments.view', 'likes.create',
    'bookmarks.manage', 'favorites.manage', 'shares.create', 'collections.view',
    'profiles.view', 'follow.manage', 'search.use', 'history.view', 'events.view',
  ],
};

export const POETRY_SOCKET_EVENTS = [
  'poetry:initialized',
  'poetry:poem:new',
  'poetry:poem:update',
  'poetry:poem:published',
  'poetry:comment:new',
  'poetry:like',
  'poetry:notification',
  'poetry:announcement',
  'poetry:event:update',
  'poetry:competition:update',
  'poetry:challenge:update',
  'poetry:moderation',
  'poetry:trending:update',
] as const;
