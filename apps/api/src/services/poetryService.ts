import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { PoetryProfile } from '../database/models/PoetryProfile';
import { PoetryPoem } from '../database/models/PoetryPoem';
import { PoetryPoemVersion } from '../database/models/PoetryPoemVersion';
import { PoetryCollection } from '../database/models/PoetryCollection';
import { PoetryComment } from '../database/models/PoetryComment';
import { PoetryLike } from '../database/models/PoetryLike';
import { PoetryBookmark } from '../database/models/PoetryBookmark';
import { PoetryFavorite } from '../database/models/PoetryFavorite';
import { PoetryShare } from '../database/models/PoetryShare';
import { PoetryFollow } from '../database/models/PoetryFollow';
import { PoetryHistory } from '../database/models/PoetryHistory';
import { PoetryEvent } from '../database/models/PoetryEvent';
import { PoetryCompetition } from '../database/models/PoetryCompetition';
import { PoetryChallenge } from '../database/models/PoetryChallenge';
import { PoetryAnnouncement } from '../database/models/PoetryAnnouncement';
import { PoetryModerationLog } from '../database/models/PoetryModerationLog';
import {
  POETRY_APP_BUNDLE,
  POETRY_CATEGORIES,
  type PoetryCategory,
  type PoemStatus,
  type PoetryRole,
  type ModerationAction,
} from '../constants/poetry';
import {
  seedPoetryRoleConfigs,
  requirePoet,
  assertPoetryPermission,
  formatPoetProfile,
  getRolePermissions,
  updateRolePermissions,
  getPoetProfile,
} from './poetryRBACService';
import {
  logPoetryAction,
  logModerationAction,
  sendPoetryNotification,
  buildPdfExport,
  estimateReadingTime,
  buildExcerpt,
  slugify,
} from './poetryIntegrationService';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function broadcastPoetry(event: string, data: unknown) {
  const poets = await PoetryProfile.find({ deletedAt: null });
  for (const p of poets) {
    emitToUser(p.userId.toString(), event as never, data);
  }
}

function formatPoem(poem: InstanceType<typeof PoetryPoem>, author?: { displayName?: string; username?: string; verified?: boolean; isServerPoet?: boolean }) {
  return {
    poemId: poem.poemId,
    authorId: poem.authorId.toString(),
    authorName: author?.displayName,
    authorUsername: author?.username,
    authorVerified: author?.verified,
    authorIsServerPoet: author?.isServerPoet,
    title: poem.title,
    slug: poem.slug,
    content: poem.content,
    markdown: poem.markdown,
    excerpt: poem.excerpt,
    category: poem.category,
    tags: poem.tags,
    status: poem.status,
    featured: poem.featured,
    pinned: poem.pinned,
    isDailyPoem: poem.isDailyPoem,
    scheduledAt: poem.scheduledAt?.toISOString(),
    publishedAt: poem.publishedAt?.toISOString(),
    coverImageUrl: poem.coverImageUrl,
    audioUrl: poem.audioUrl,
    videoUrl: poem.videoUrl,
    backgroundMusicUrl: poem.backgroundMusicUrl,
    galleryImageIds: poem.galleryImageIds,
    likeCount: poem.likeCount,
    commentCount: poem.commentCount,
    shareCount: poem.shareCount,
    viewCount: poem.viewCount,
    bookmarkCount: poem.bookmarkCount,
    readingTimeMinutes: poem.readingTimeMinutes,
    versionNumber: poem.versionNumber,
    createdAt: poem.createdAt?.toISOString(),
    updatedAt: poem.updatedAt?.toISOString(),
  };
}

async function getAuthorMeta(authorId: Types.ObjectId) {
  const [user, profile] = await Promise.all([
    User.findById(authorId),
    PoetryProfile.findOne({ userId: authorId, deletedAt: null }),
  ]);
  return {
    displayName: profile?.displayName || user?.displayName,
    username: user?.username,
    verified: profile?.verified,
    isServerPoet: profile?.isServerPoet,
  };
}

async function enrichPoems(poems: InstanceType<typeof PoetryPoem>[]) {
  return Promise.all(poems.map(async (p) => formatPoem(p, await getAuthorMeta(p.authorId))));
}

// ─── Initialize ───────────────────────────────────────────────────────────────

export async function initializePoetry(userId: string, userRole?: string) {
  await seedPoetryRoleConfigs();

  const hasApp = await checkPermission(userId, POETRY_APP_BUNDLE, 'network');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  let profile = await PoetryProfile.findOne({ userId, deletedAt: null });
  if (!profile) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const isFirst = (await PoetryProfile.countDocuments({ deletedAt: null })) === 0;
    profile = await PoetryProfile.create({
      userId: new Types.ObjectId(userId),
      role: isFirst ? 'server_poet' : 'viewer',
      displayName: user.displayName || user.username,
      bio: '',
      verified: isFirst,
      isServerPoet: isFirst,
      badges: isFirst ? ['Official Server Poet'] : [],
      createdBy: new Types.ObjectId(userId),
    });
    if (isFirst) {
      await seedOfficialContent(userId);
    }
  }

  const permissions = await getRolePermissions(profile.role);
  const payload = {
    profile: formatPoetProfile(profile, await User.findById(userId) ?? undefined),
    permissions,
    categories: POETRY_CATEGORIES,
  };

  emitToUser(userId, 'poetry:initialized', payload);
  return payload;
}

async function seedOfficialContent(userId: string) {
  const existing = await PoetryPoem.countDocuments({ deletedAt: null });
  if (existing > 0) return;

  const poems = [
    {
      title: 'Ode to the Gulf',
      content: 'Upon these shores where golden sun meets endless sea,\nThe server stands united, proud, and free.\nEach verse we write, each word we share,\nBuilds bridges strong beyond compare.',
      category: 'national' as PoetryCategory,
      tags: ['official', 'gulf', 'server'],
      featured: true,
      pinned: true,
      isDailyPoem: true,
    },
    {
      title: 'Guardians in Blue',
      content: 'Through streets of duty, honor leads the way,\nThe guardians serve both night and day.\nWith courage forged in service true,\nWe stand for justice — me and you.',
      category: 'police' as PoetryCategory,
      tags: ['police', 'service', 'honor'],
      featured: true,
    },
    {
      title: 'Wisdom of the Waves',
      content: 'The ocean teaches patience, depth, and grace,\nIn every tide, a lesson we embrace.\nLet wisdom flow like waters wide,\nA gentle, ever-present guide.',
      category: 'wisdom' as PoetryCategory,
      tags: ['wisdom', 'nature'],
    },
  ];

  for (const p of poems) {
    await PoetryPoem.create({
      poemId: id('POEM'),
      authorId: new Types.ObjectId(userId),
      title: p.title,
      slug: slugify(p.title),
      content: p.content,
      markdown: p.content,
      excerpt: buildExcerpt(p.content),
      category: p.category,
      tags: p.tags,
      status: 'published',
      featured: p.featured ?? false,
      pinned: p.pinned ?? false,
      isDailyPoem: p.isDailyPoem ?? false,
      publishedAt: new Date(),
      readingTimeMinutes: estimateReadingTime(p.content),
      createdBy: new Types.ObjectId(userId),
    });
  }

  await PoetryProfile.findOneAndUpdate(
    { userId },
    { poemCount: poems.length, totalViews: 0, totalLikes: 0 }
  );

  await PoetryAnnouncement.create({
    announcementId: id('ANN'),
    title: 'Welcome to GULF Poetry',
    body: 'The official poetry platform of the server is now live. Share your verses, join competitions, and celebrate the art of words.',
    priority: 'high',
    authorId: new Types.ObjectId(userId),
    pinned: true,
    createdBy: new Types.ObjectId(userId),
  });
}

// ─── Home Feed ──────────────────────────────────────────────────────────────

export async function getHomeFeed(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'home.view', userRole);
  const base = { deletedAt: null, status: 'published' };

  const [featured, latest, popular, daily, trending, announcements] = await Promise.all([
    PoetryPoem.find({ ...base, featured: true }).sort({ publishedAt: -1 }).limit(6),
    PoetryPoem.find(base).sort({ publishedAt: -1 }).limit(10),
    PoetryPoem.find(base).sort({ likeCount: -1, viewCount: -1 }).limit(10),
    PoetryPoem.findOne({ ...base, isDailyPoem: true }).sort({ publishedAt: -1 }),
    PoetryPoem.find(base).sort({ viewCount: -1, likeCount: -1 }).limit(8),
    PoetryAnnouncement.find({ deletedAt: null }).sort({ pinned: -1, createdAt: -1 }).limit(5),
  ]);

  return {
    featured: await enrichPoems(featured),
    latest: await enrichPoems(latest),
    popular: await enrichPoems(popular),
    daily: daily ? formatPoem(daily, await getAuthorMeta(daily.authorId)) : null,
    trending: await enrichPoems(trending),
    announcements: announcements.map((a) => ({
      announcementId: a.announcementId,
      title: a.title,
      body: a.body,
      priority: a.priority,
      pinned: a.pinned,
      createdAt: a.createdAt?.toISOString(),
    })),
    categories: POETRY_CATEGORIES,
  };
}

export async function getRandomPoem(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'poems.view', userRole);
  const count = await PoetryPoem.countDocuments({ deletedAt: null, status: 'published' });
  if (count === 0) throw new Error('NO_POEMS');
  const skip = Math.floor(Math.random() * count);
  const poem = await PoetryPoem.findOne({ deletedAt: null, status: 'published' }).skip(skip);
  if (!poem) throw new Error('NO_POEMS');
  return formatPoem(poem, await getAuthorMeta(poem.authorId));
}

// ─── Poems CRUD ─────────────────────────────────────────────────────────────

export async function listPoems(
  userId: string,
  userRole: string | undefined,
  filters: { category?: string; status?: string; authorId?: string; featured?: boolean; mine?: boolean }
) {
  await assertPoetryPermission(userId, 'poems.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.mine) {
    await assertPoetryPermission(userId, 'poems.view.drafts', userRole);
    query.authorId = new Types.ObjectId(userId);
    if (filters.status) query.status = filters.status;
    else query.status = { $in: ['draft', 'scheduled', 'pending_review', 'published', 'archived'] };
  } else {
    query.status = filters.status ?? 'published';
  }

  if (filters.category) query.category = filters.category;
  if (filters.authorId) query.authorId = new Types.ObjectId(filters.authorId);
  if (filters.featured) query.featured = true;

  const poems = await PoetryPoem.find(query).sort({ pinned: -1, publishedAt: -1, createdAt: -1 }).limit(50);
  return enrichPoems(poems);
}

export async function getPoem(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'poems.view', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');

  if (poem.status !== 'published' && poem.authorId.toString() !== userId && userRole !== 'admin') {
    await assertPoetryPermission(userId, 'poems.view.drafts', userRole);
    if (poem.authorId.toString() !== userId) throw new Error('PERMISSION_DENIED');
  }

  await PoetryPoem.findByIdAndUpdate(poem._id, { $inc: { viewCount: 1 } });
  await PoetryHistory.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), poemId },
    { readAt: new Date() },
    { upsert: true }
  );

  const [liked, bookmarked, favorited] = await Promise.all([
    PoetryLike.findOne({ poemId, userId }),
    PoetryBookmark.findOne({ poemId, userId }),
    PoetryFavorite.findOne({ poemId, userId }),
  ]);

  return {
    ...formatPoem(poem, await getAuthorMeta(poem.authorId)),
    liked: Boolean(liked),
    bookmarked: Boolean(bookmarked),
    favorited: Boolean(favorited),
  };
}

export async function createPoem(
  userId: string,
  userRole: string | undefined,
  data: {
    title: string;
    content?: string;
    markdown?: string;
    category: PoetryCategory;
    tags?: string[];
    coverImageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    backgroundMusicUrl?: string;
    galleryImageIds?: string[];
    status?: PoemStatus;
    scheduledAt?: string;
  },
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertPoetryPermission(userId, 'poems.create', userRole);
  const text = data.markdown || data.content || '';
  const poemId = id('POEM');
  const status = data.status ?? 'draft';

  const poem = await PoetryPoem.create({
    poemId,
    authorId: new Types.ObjectId(userId),
    title: data.title,
    slug: slugify(data.title),
    content: data.content ?? '',
    markdown: data.markdown ?? data.content ?? '',
    excerpt: buildExcerpt(text),
    category: data.category,
    tags: data.tags ?? [],
    status,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    coverImageUrl: data.coverImageUrl,
    audioUrl: data.audioUrl,
    videoUrl: data.videoUrl,
    backgroundMusicUrl: data.backgroundMusicUrl,
    galleryImageIds: data.galleryImageIds ?? [],
    readingTimeMinutes: estimateReadingTime(text),
    createdBy: new Types.ObjectId(userId),
  });

  await PoetryPoemVersion.create({
    versionId: id('VER'),
    poemId,
    versionNumber: 1,
    title: data.title,
    content: poem.content,
    markdown: poem.markdown,
    changeNote: 'Initial draft',
    savedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  if (status === 'published') {
    await assertPoetryPermission(userId, 'poems.publish', userRole);
    poem.publishedAt = new Date();
    poem.status = 'published';
    await poem.save();
    await PoetryProfile.findOneAndUpdate({ userId }, { $inc: { poemCount: 1 } });
    await broadcastPoetry('poetry:poem:published', formatPoem(poem, await getAuthorMeta(poem.authorId)));
  }

  await logPoetryAction({
    userId,
    actorId: userId,
    action: 'poetry_poem_create',
    resource: 'poetry_poem',
    resourceId: poemId,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
  });

  return formatPoem(poem, await getAuthorMeta(poem.authorId));
}

export async function updatePoem(
  userId: string,
  poemId: string,
  userRole: string | undefined,
  data: Partial<{
    title: string;
    content: string;
    markdown: string;
    category: PoetryCategory;
    tags: string[];
    coverImageUrl: string;
    audioUrl: string;
    videoUrl: string;
    backgroundMusicUrl: string;
    galleryImageIds: string[];
    status: PoemStatus;
    scheduledAt: string;
    changeNote: string;
  }>,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertPoetryPermission(userId, 'poems.edit', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');
  if (poem.authorId.toString() !== userId && userRole !== 'admin') {
    await assertPoetryPermission(userId, 'poems.moderate', userRole);
  }

  const text = data.markdown ?? data.content ?? poem.markdown ?? poem.content;
  if (data.title) { poem.title = data.title; poem.slug = slugify(data.title); }
  if (data.content !== undefined) poem.content = data.content;
  if (data.markdown !== undefined) poem.markdown = data.markdown;
  if (data.category) poem.category = data.category;
  if (data.tags) poem.tags = data.tags;
  if (data.coverImageUrl !== undefined) poem.coverImageUrl = data.coverImageUrl;
  if (data.audioUrl !== undefined) poem.audioUrl = data.audioUrl;
  if (data.videoUrl !== undefined) poem.videoUrl = data.videoUrl;
  if (data.backgroundMusicUrl !== undefined) poem.backgroundMusicUrl = data.backgroundMusicUrl;
  if (data.galleryImageIds) poem.galleryImageIds = data.galleryImageIds;
  if (data.scheduledAt) poem.scheduledAt = new Date(data.scheduledAt);

  poem.excerpt = buildExcerpt(text);
  poem.readingTimeMinutes = estimateReadingTime(text);
  poem.versionNumber += 1;
  poem.updatedBy = new Types.ObjectId(userId);

  if (data.status === 'published' && poem.status !== 'published') {
    await assertPoetryPermission(userId, 'poems.publish', userRole);
    poem.status = 'published';
    poem.publishedAt = new Date();
    await PoetryProfile.findOneAndUpdate({ userId: poem.authorId }, { $inc: { poemCount: 1 } });
    await broadcastPoetry('poetry:poem:published', formatPoem(poem, await getAuthorMeta(poem.authorId)));
  } else if (data.status) {
    poem.status = data.status;
  }

  await poem.save();

  await PoetryPoemVersion.create({
    versionId: id('VER'),
    poemId,
    versionNumber: poem.versionNumber,
    title: poem.title,
    content: poem.content,
    markdown: poem.markdown,
    changeNote: data.changeNote ?? 'Auto-saved revision',
    savedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  await logPoetryAction({
    userId,
    actorId: userId,
    action: 'poetry_poem_update',
    resource: 'poetry_poem',
    resourceId: poemId,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
  });

  emitToUser(userId, 'poetry:poem:update', formatPoem(poem, await getAuthorMeta(poem.authorId)));
  return formatPoem(poem, await getAuthorMeta(poem.authorId));
}

export async function deletePoem(userId: string, poemId: string, userRole?: string, meta?: { ipAddress?: string; deviceUuid?: string }) {
  await assertPoetryPermission(userId, 'poems.delete', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');
  if (poem.authorId.toString() !== userId && userRole !== 'admin') throw new Error('PERMISSION_DENIED');

  await PoetryPoem.findByIdAndUpdate(poem._id, { deletedAt: new Date(), updatedBy: new Types.ObjectId(userId) });
  await logPoetryAction({
    userId, actorId: userId, action: 'poetry_poem_delete', resource: 'poetry_poem', resourceId: poemId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });
  return { deleted: true };
}

export async function listPoemVersions(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'poems.view', userRole);
  const versions = await PoetryPoemVersion.find({ poemId, deletedAt: null }).sort({ versionNumber: -1 });
  return versions.map((v) => ({
    versionId: v.versionId,
    versionNumber: v.versionNumber,
    title: v.title,
    changeNote: v.changeNote,
    savedAt: v.createdAt?.toISOString(),
  }));
}

export async function exportPoemPdf(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'pdf.export', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');
  const author = await getAuthorMeta(poem.authorId);
  return buildPdfExport({
    title: poem.title,
    content: poem.content,
    markdown: poem.markdown,
    authorName: author.displayName ?? 'Unknown',
    category: poem.category,
    publishedAt: poem.publishedAt,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchPoems(
  userId: string,
  userRole: string | undefined,
  params: { q?: string; category?: string; author?: string; tag?: string; sort?: string }
) {
  await assertPoetryPermission(userId, 'search.use', userRole);
  const query: Record<string, unknown> = { deletedAt: null, status: 'published' };

  if (params.category) query.category = params.category;
  if (params.tag) query.tags = params.tag;
  if (params.author) {
    const profile = await PoetryProfile.findOne({
      $or: [{ displayName: new RegExp(params.author, 'i') }],
      deletedAt: null,
    });
    if (profile) query.authorId = profile.userId;
  }

  let sort: Record<string, 1 | -1> = { publishedAt: -1 };
  if (params.sort === 'popularity') sort = { likeCount: -1, viewCount: -1 };
  if (params.sort === 'title') sort = { title: 1 };

  let poems;
  if (params.q) {
    poems = await PoetryPoem.find({ ...query, $text: { $search: params.q } }).sort(sort).limit(30);
    if (poems.length === 0) {
      poems = await PoetryPoem.find({
        ...query,
        $or: [
          { title: new RegExp(params.q, 'i') },
          { tags: new RegExp(params.q, 'i') },
        ],
      }).sort(sort).limit(30);
    }
  } else {
    poems = await PoetryPoem.find(query).sort(sort).limit(30);
  }

  return enrichPoems(poems);
}

// ─── Social ───────────────────────────────────────────────────────────────────

export async function likePoem(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'likes.create', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null, status: 'published' });
  if (!poem) throw new Error('POEM_NOT_FOUND');

  const existing = await PoetryLike.findOne({ poemId, userId });
  if (existing) {
    await PoetryLike.deleteOne({ _id: existing._id });
    await PoetryPoem.findByIdAndUpdate(poem._id, { $inc: { likeCount: -1 } });
    await PoetryProfile.findOneAndUpdate({ userId: poem.authorId }, { $inc: { totalLikes: -1 } });
    return { liked: false, likeCount: Math.max(0, poem.likeCount - 1) };
  }

  await PoetryLike.create({ poemId, userId: new Types.ObjectId(userId) });
  await PoetryPoem.findByIdAndUpdate(poem._id, { $inc: { likeCount: 1 } });
  await PoetryProfile.findOneAndUpdate({ userId: poem.authorId }, { $inc: { totalLikes: 1 } });

  if (poem.authorId.toString() !== userId) {
    await sendPoetryNotification({
      userId: poem.authorId.toString(),
      title: 'New Like',
      body: `Someone liked "${poem.title}"`,
      deepLink: `gulfos://poetry/poem/${poemId}`,
    });
  }

  emitToUser(poem.authorId.toString(), 'poetry:like', { poemId, likeCount: poem.likeCount + 1 });
  return { liked: true, likeCount: poem.likeCount + 1 };
}

export async function addComment(userId: string, poemId: string, body: string, parentId?: string, userRole?: string) {
  await assertPoetryPermission(userId, 'comments.create', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null, status: 'published' });
  if (!poem) throw new Error('POEM_NOT_FOUND');

  const comment = await PoetryComment.create({
    commentId: id('CMT'),
    poemId,
    userId: new Types.ObjectId(userId),
    body,
    parentId,
    createdBy: new Types.ObjectId(userId),
  });

  await PoetryPoem.findByIdAndUpdate(poem._id, { $inc: { commentCount: 1 } });

  const user = await User.findById(userId);
  const payload = {
    commentId: comment.commentId,
    poemId,
    body,
    parentId,
    authorName: user?.displayName,
    createdAt: comment.createdAt?.toISOString(),
  };

  emitToUser(poem.authorId.toString(), 'poetry:comment:new', payload);
  await broadcastPoetry('poetry:comment:new', payload);
  return payload;
}

export async function listComments(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'comments.view', userRole);
  const comments = await PoetryComment.find({ poemId, deletedAt: null }).sort({ createdAt: -1 }).limit(100);
  return Promise.all(comments.map(async (c) => {
    const user = await User.findById(c.userId);
    return {
      commentId: c.commentId,
      poemId: c.poemId,
      body: c.body,
      parentId: c.parentId,
      likeCount: c.likeCount,
      authorName: user?.displayName,
      authorId: c.userId.toString(),
      createdAt: c.createdAt?.toISOString(),
    };
  }));
}

export async function toggleBookmark(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'bookmarks.manage', userRole);
  const existing = await PoetryBookmark.findOne({ poemId, userId });
  if (existing) {
    await PoetryBookmark.deleteOne({ _id: existing._id });
    await PoetryPoem.findOneAndUpdate({ poemId }, { $inc: { bookmarkCount: -1 } });
    return { bookmarked: false };
  }
  await PoetryBookmark.create({ poemId, userId: new Types.ObjectId(userId) });
  await PoetryPoem.findOneAndUpdate({ poemId }, { $inc: { bookmarkCount: 1 } });
  return { bookmarked: true };
}

export async function toggleFavorite(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'favorites.manage', userRole);
  const existing = await PoetryFavorite.findOne({ poemId, userId });
  if (existing) {
    await PoetryFavorite.deleteOne({ _id: existing._id });
    return { favorited: false };
  }
  await PoetryFavorite.create({ poemId, userId: new Types.ObjectId(userId) });
  return { favorited: true };
}

export async function sharePoem(userId: string, poemId: string, channel: string, userRole?: string) {
  await assertPoetryPermission(userId, 'shares.create', userRole);
  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');

  await PoetryShare.create({
    shareId: id('SHR'),
    poemId,
    userId: new Types.ObjectId(userId),
    channel,
  });
  await PoetryPoem.findByIdAndUpdate(poem._id, { $inc: { shareCount: 1 } });
  return { shared: true, deepLink: `gulfos://poetry/poem/${poemId}` };
}

export async function listBookmarks(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'bookmarks.manage', userRole);
  const bookmarks = await PoetryBookmark.find({ userId }).sort({ createdAt: -1 });
  const poems = await PoetryPoem.find({ poemId: { $in: bookmarks.map((b) => b.poemId) }, deletedAt: null });
  return enrichPoems(poems);
}

export async function listFavorites(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'favorites.manage', userRole);
  const favorites = await PoetryFavorite.find({ userId }).sort({ createdAt: -1 });
  const poems = await PoetryPoem.find({ poemId: { $in: favorites.map((f) => f.poemId) }, deletedAt: null });
  return enrichPoems(poems);
}

export async function listHistory(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'history.view', userRole);
  const history = await PoetryHistory.find({ userId }).sort({ readAt: -1 }).limit(50);
  const poems = await PoetryPoem.find({ poemId: { $in: history.map((h) => h.poemId) }, deletedAt: null });
  return enrichPoems(poems);
}

// ─── Profiles & Follow ──────────────────────────────────────────────────────

export async function getProfile(targetUserId: string, viewerId: string, userRole?: string) {
  await assertPoetryPermission(viewerId, 'profiles.view', userRole);
  const profile = await PoetryProfile.findOne({ userId: targetUserId, deletedAt: null });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const user = await User.findById(targetUserId);
  const poems = await PoetryPoem.find({ authorId: targetUserId, deletedAt: null, status: 'published' }).sort({ publishedAt: -1 }).limit(20);
  const following = await PoetryFollow.findOne({ followerId: viewerId, followingId: targetUserId });

  return {
    ...formatPoetProfile(profile, user ?? undefined),
    publishedPoems: await enrichPoems(poems),
    isFollowing: Boolean(following),
    statistics: {
      poemCount: profile.poemCount,
      totalLikes: profile.totalLikes,
      totalViews: profile.totalViews,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
    },
  };
}

export async function updateProfile(
  userId: string,
  data: Partial<{ displayName: string; bio: string; avatarUrl: string; coverImageUrl: string; website: string }>,
  userRole?: string
) {
  await assertPoetryPermission(userId, 'profiles.edit', userRole);
  const profile = await requirePoet(userId);
  if (data.displayName) profile.displayName = data.displayName;
  if (data.bio !== undefined) profile.bio = data.bio;
  if (data.avatarUrl !== undefined) profile.avatarUrl = data.avatarUrl;
  if (data.coverImageUrl !== undefined) profile.coverImageUrl = data.coverImageUrl;
  if (data.website !== undefined) profile.website = data.website;
  profile.updatedBy = new Types.ObjectId(userId);
  await profile.save();
  const user = await User.findById(userId);
  return formatPoetProfile(profile, user ?? undefined);
}

export async function followPoet(userId: string, targetUserId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'follow.manage', userRole);
  if (userId === targetUserId) throw new Error('CANNOT_FOLLOW_SELF');

  const existing = await PoetryFollow.findOne({ followerId: userId, followingId: targetUserId });
  if (existing) {
    await PoetryFollow.deleteOne({ _id: existing._id });
    await PoetryProfile.findOneAndUpdate({ userId: targetUserId }, { $inc: { followerCount: -1 } });
    await PoetryProfile.findOneAndUpdate({ userId }, { $inc: { followingCount: -1 } });
    return { following: false };
  }

  await PoetryFollow.create({
    followerId: new Types.ObjectId(userId),
    followingId: new Types.ObjectId(targetUserId),
  });
  await PoetryProfile.findOneAndUpdate({ userId: targetUserId }, { $inc: { followerCount: 1 } });
  await PoetryProfile.findOneAndUpdate({ userId }, { $inc: { followingCount: 1 } });

  await sendPoetryNotification({
    userId: targetUserId,
    title: 'New Follower',
    body: 'Someone started following you on GULF Poetry',
    deepLink: `gulfos://poetry/profile/${userId}`,
  });

  return { following: true };
}

export async function listVerifiedPoets(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'profiles.view', userRole);
  const profiles = await PoetryProfile.find({ deletedAt: null, verified: true }).sort({ isServerPoet: -1, poemCount: -1 });
  return Promise.all(profiles.map(async (p) => {
    const user = await User.findById(p.userId);
    return formatPoetProfile(p, user ?? undefined);
  }));
}

// ─── Collections ────────────────────────────────────────────────────────────

export async function listCollections(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'collections.view', userRole);
  const collections = await PoetryCollection.find({
    deletedAt: null,
    $or: [{ ownerId: userId }, { isPublic: true }],
  }).sort({ updatedAt: -1 });
  return collections.map((c) => ({
    collectionId: c.collectionId,
    title: c.title,
    description: c.description,
    poemCount: c.poemIds.length,
    isPublic: c.isPublic,
    coverImageUrl: c.coverImageUrl,
    ownerId: c.ownerId.toString(),
  }));
}

export async function createCollection(
  userId: string,
  data: { title: string; description?: string; isPublic?: boolean; poemIds?: string[] },
  userRole?: string
) {
  await assertPoetryPermission(userId, 'collections.create', userRole);
  const collection = await PoetryCollection.create({
    collectionId: id('COL'),
    ownerId: new Types.ObjectId(userId),
    title: data.title,
    description: data.description ?? '',
    poemIds: data.poemIds ?? [],
    isPublic: data.isPublic ?? true,
    createdBy: new Types.ObjectId(userId),
  });
  return {
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    poemIds: collection.poemIds,
    isPublic: collection.isPublic,
  };
}

// ─── Events / Competitions / Challenges ─────────────────────────────────────

export async function listEvents(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'events.view', userRole);
  const events = await PoetryEvent.find({ deletedAt: null }).sort({ startsAt: 1 });
  return events.map((e) => ({
    eventId: e.eventId,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    status: e.status,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString(),
    location: e.location,
    attendeeCount: e.attendeeCount,
    poemCount: e.poemIds.length,
  }));
}

export async function createEvent(
  userId: string,
  data: { title: string; description?: string; eventType: string; startsAt: string; endsAt?: string; location?: string },
  userRole?: string
) {
  await assertPoetryPermission(userId, 'events.manage', userRole);
  const event = await PoetryEvent.create({
    eventId: id('EVT'),
    title: data.title,
    description: data.description ?? '',
    eventType: data.eventType,
    status: 'upcoming',
    startsAt: new Date(data.startsAt),
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    location: data.location,
    hostId: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });
  await broadcastPoetry('poetry:event:update', { eventId: event.eventId, action: 'created' });
  return { eventId: event.eventId, title: event.title, status: event.status };
}

export async function listCompetitions(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'events.view', userRole);
  const items = await PoetryCompetition.find({ deletedAt: null }).sort({ startsAt: -1 });
  return items.map((c) => ({
    competitionId: c.competitionId,
    title: c.title,
    description: c.description,
    status: c.status,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    entryCount: c.entryPoemIds.length,
    prizeDescription: c.prizeDescription,
  }));
}

export async function listChallenges(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'events.view', userRole);
  const items = await PoetryChallenge.find({ deletedAt: null, status: 'active' }).sort({ endsAt: 1 });
  return items.map((c) => ({
    challengeId: c.challengeId,
    title: c.title,
    prompt: c.prompt,
    status: c.status,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    entryCount: c.entryPoemIds.length,
    category: c.category,
  }));
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export async function moderatePoem(
  userId: string,
  poemId: string,
  action: ModerationAction,
  reason?: string,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const permissionMap: Record<ModerationAction, string> = {
    approve: 'poems.approve',
    reject: 'poems.reject',
    hide: 'poems.hide',
    feature: 'poems.feature',
    pin: 'poems.pin',
    archive: 'poems.archive',
    delete: 'poems.moderate',
  };
  await assertPoetryPermission(userId, permissionMap[action] as never, userRole);

  const poem = await PoetryPoem.findOne({ poemId, deletedAt: null });
  if (!poem) throw new Error('POEM_NOT_FOUND');

  switch (action) {
    case 'approve':
      poem.status = 'published';
      poem.publishedAt = poem.publishedAt ?? new Date();
      break;
    case 'reject':
      poem.status = 'rejected';
      poem.moderationNote = reason;
      break;
    case 'hide':
      poem.status = 'hidden';
      break;
    case 'feature':
      poem.featured = true;
      break;
    case 'pin':
      poem.pinned = true;
      break;
    case 'archive':
      poem.status = 'archived';
      break;
    case 'delete':
      poem.deletedAt = new Date();
      break;
  }

  poem.updatedBy = new Types.ObjectId(userId);
  await poem.save();

  await logModerationAction({
    poemId,
    actorId: userId,
    action,
    reason,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
  });

  await broadcastPoetry('poetry:moderation', { poemId, action });
  return formatPoem(poem, await getAuthorMeta(poem.authorId));
}

export async function listModerationLogs(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'audit.view', userRole);
  const logs = await PoetryModerationLog.find().sort({ createdAt: -1 }).limit(50);
  return logs.map((l) => ({
    logId: l.logId,
    poemId: l.poemId,
    action: l.action,
    reason: l.reason,
    actorId: l.actorId.toString(),
    createdAt: l.createdAt?.toISOString(),
  }));
}

// ─── Analytics & RBAC ───────────────────────────────────────────────────────

export async function getAnalytics(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'analytics.view', userRole);
  const [totalPoems, publishedPoems, totalLikes, totalViews, totalComments, totalPoets] = await Promise.all([
    PoetryPoem.countDocuments({ deletedAt: null }),
    PoetryPoem.countDocuments({ deletedAt: null, status: 'published' }),
    PoetryLike.countDocuments(),
    PoetryPoem.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: null, total: { $sum: '$viewCount' } } }]),
    PoetryComment.countDocuments({ deletedAt: null }),
    PoetryProfile.countDocuments({ deletedAt: null }),
  ]);

  return {
    totalPoems,
    publishedPoems,
    totalLikes,
    totalViews: totalViews[0]?.total ?? 0,
    totalComments,
    totalPoets,
    categories: POETRY_CATEGORIES,
  };
}

export async function getRbac(userId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'poetry.access', userRole);
  const profile = await requirePoet(userId);
  const permissions = await getRolePermissions(profile.role);
  const configs = await Promise.all(
    (['server_poet', 'poet', 'assistant_poet', 'publisher', 'moderator', 'viewer'] as PoetryRole[]).map(async (role) => ({
      role,
      permissions: await getRolePermissions(role),
    }))
  );
  return { myRole: profile.role, myPermissions: permissions, roles: configs };
}

export async function updateRbac(
  userId: string,
  role: PoetryRole,
  permissions: string[],
  userRole?: string
) {
  await assertPoetryPermission(userId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

export async function createAnnouncement(
  userId: string,
  data: { title: string; body: string; priority?: string; pinned?: boolean },
  userRole?: string
) {
  await assertPoetryPermission(userId, 'announcements.broadcast', userRole);
  const announcement = await PoetryAnnouncement.create({
    announcementId: id('ANN'),
    title: data.title,
    body: data.body,
    priority: (data.priority as 'low' | 'normal' | 'high') ?? 'normal',
    authorId: new Types.ObjectId(userId),
    pinned: data.pinned ?? false,
    createdBy: new Types.ObjectId(userId),
  });
  await broadcastPoetry('poetry:announcement', {
    announcementId: announcement.announcementId,
    title: announcement.title,
    body: announcement.body,
  });
  return { announcementId: announcement.announcementId, title: announcement.title };
}

export async function setDailyPoem(userId: string, poemId: string, userRole?: string) {
  await assertPoetryPermission(userId, 'daily.poem.manage', userRole);
  await PoetryPoem.updateMany({ isDailyPoem: true }, { isDailyPoem: false });
  const poem = await PoetryPoem.findOneAndUpdate({ poemId, deletedAt: null }, { isDailyPoem: true }, { new: true });
  if (!poem) throw new Error('POEM_NOT_FOUND');
  return formatPoem(poem, await getAuthorMeta(poem.authorId));
}
