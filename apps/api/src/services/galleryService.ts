import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { GalleryItem } from '../database/models/GalleryItem';
import { GalleryAlbum } from '../database/models/GalleryAlbum';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { emitToUser } from './socketService';

function formatItem(item: InstanceType<typeof GalleryItem>) {
  return {
    itemId: item.itemId,
    albumId: item.albumId,
    type: item.type,
    name: item.name,
    sizeBytes: item.sizeBytes,
    mode: item.mode,
    favorite: item.favorite,
    hidden: item.hidden,
    trashed: item.trashed,
    aiCategory: item.aiCategory,
    capturedAt: item.capturedAt.toISOString(),
    metadata: item.metadata,
  };
}

export async function ensureDefaultAlbums(userId: string) {
  const defaults = [
    { albumId: 'all-photos', name: 'All Photos', type: 'system' as const },
    { albumId: 'favorites', name: 'Favorites', type: 'system' as const },
    { albumId: 'hidden', name: 'Hidden', type: 'hidden' as const },
    { albumId: 'videos', name: 'Videos', type: 'system' as const },
  ];
  for (const a of defaults) {
    await GalleryAlbum.findOneAndUpdate(
      { userId, albumId: a.albumId },
      { userId: new Types.ObjectId(userId), ...a, itemCount: 0 },
      { upsert: true }
    );
  }
}

export async function listGalleryItems(userId: string, filter: {
  albumId?: string;
  type?: 'photo' | 'video';
  favorite?: boolean;
  hidden?: boolean;
  trashed?: boolean;
  q?: string;
} = {}) {
  const query: Record<string, unknown> = { userId, deletedAt: null };
  if (filter.type) query.type = filter.type;
  if (filter.favorite !== undefined) query.favorite = filter.favorite;
  if (filter.hidden !== undefined) query.hidden = filter.hidden;
  query.trashed = filter.trashed ?? false;
  if (filter.albumId) query.albumId = filter.albumId;
  if (filter.q) query.name = { $regex: filter.q, $options: 'i' };

  const items = await GalleryItem.find(query).sort({ capturedAt: -1 }).limit(200);
  return items.map(formatItem);
}

export async function getGalleryAlbums(userId: string) {
  await ensureDefaultAlbums(userId);
  const albums = await GalleryAlbum.find({ userId, deletedAt: null });
  return albums.map((a) => ({
    albumId: a.albumId,
    name: a.name,
    type: a.type,
    itemCount: a.itemCount,
    coverItemId: a.coverItemId,
  }));
}

export async function createGalleryItemFromCapture(
  userId: string,
  params: {
    type: 'photo' | 'video';
    name: string;
    sizeBytes: number;
    mode?: string;
    megapixels?: number;
    durationSeconds?: number;
    width?: number;
    height?: number;
    metadata?: Record<string, unknown>;
  },
  actorId: string
) {
  const itemId = uuidv4();
  const aiCategory = params.type === 'photo'
    ? ['Nature', 'Portrait', 'Food', 'Architecture'][Math.floor(Math.random() * 4)]
    : 'Video';

  const item = await GalleryItem.create({
    userId: new Types.ObjectId(userId),
    itemId,
    type: params.type,
    name: params.name,
    sizeBytes: params.sizeBytes,
    mode: params.mode,
    megapixels: params.megapixels,
    durationSeconds: params.durationSeconds,
    width: params.width,
    height: params.height,
    aiCategory,
    metadata: params.metadata ?? {},
    createdBy: new Types.ObjectId(actorId),
  });

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.gallery, action: 'item_create', resourceId: itemId });
  emitToUser(userId, 'gallery:update', { action: 'item_added', itemId });
  return formatItem(item);
}

export async function toggleFavorite(userId: string, itemId: string, actorId: string) {
  const item = await GalleryItem.findOne({ userId, itemId, deletedAt: null });
  if (!item) throw new Error('ITEM_NOT_FOUND');
  item.favorite = !item.favorite;
  item.updatedBy = new Types.ObjectId(actorId);
  await item.save();
  emitToUser(userId, 'gallery:update', { action: 'favorite', itemId, favorite: item.favorite });
  return formatItem(item);
}

export async function moveToTrash(userId: string, itemId: string, actorId: string) {
  const item = await GalleryItem.findOne({ userId, itemId, deletedAt: null });
  if (!item) throw new Error('ITEM_NOT_FOUND');
  item.trashed = true;
  item.trashedAt = new Date();
  await item.save();
  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.gallery, action: 'item_trash', resourceId: itemId });
  emitToUser(userId, 'gallery:update', { action: 'trash', itemId });
  return formatItem(item);
}

export async function getAiCategories(userId: string) {
  const items = await GalleryItem.find({ userId, deletedAt: null, trashed: false, aiCategory: { $exists: true } });
  const cats = new Map<string, number>();
  for (const i of items) {
    if (i.aiCategory) cats.set(i.aiCategory, (cats.get(i.aiCategory) ?? 0) + 1);
  }
  return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
}

export async function getMemoryTimeline(userId: string) {
  const items = await GalleryItem.find({ userId, deletedAt: null, trashed: false }).sort({ capturedAt: -1 }).limit(50);
  const byMonth = new Map<string, number>();
  for (const i of items) {
    const key = i.capturedAt.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  return Array.from(byMonth.entries()).map(([month, count]) => ({ month, count }));
}

export async function getStorageAnalysis(userId: string) {
  const items = await GalleryItem.find({ userId, deletedAt: null, trashed: false });
  const photos = items.filter((i) => i.type === 'photo');
  const videos = items.filter((i) => i.type === 'video');
  return {
    totalItems: items.length,
    photoCount: photos.length,
    videoCount: videos.length,
    photoBytes: photos.reduce((s, i) => s + i.sizeBytes, 0),
    videoBytes: videos.reduce((s, i) => s + i.sizeBytes, 0),
    totalBytes: items.reduce((s, i) => s + i.sizeBytes, 0),
  };
}
