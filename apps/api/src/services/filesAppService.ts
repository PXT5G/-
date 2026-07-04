import { Types } from 'mongoose';
import { FileNode } from '../database/models/FileNode';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { emitToUser } from './socketService';

const FAVORITES_KEY = '__favorites__';
const RECENT_KEY = '__recent__';

function formatFile(file: InstanceType<typeof FileNode>) {
  return {
    id: file._id.toString(),
    name: file.name,
    type: file.type,
    mimeType: file.mimeType,
    size: file.size,
    parentId: file.parentId?.toString() ?? null,
    path: file.path,
    favorite: (file as IFileWithMeta).favorite ?? false,
    category: categorizeFile(file),
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

interface IFileWithMeta extends InstanceType<typeof FileNode> {
  favorite?: boolean;
}

function categorizeFile(file: InstanceType<typeof FileNode>): string {
  const mime = file.mimeType ?? '';
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf')) return 'documents';
  if (mime.includes('zip') || mime.includes('archive')) return 'archives';
  if (file.path.includes('/Downloads')) return 'downloads';
  return 'documents';
}

export async function searchFiles(userId: string, q: string) {
  const files = await FileNode.find({
    userId,
    name: { $regex: q, $options: 'i' },
    type: 'file',
  }).sort({ updatedAt: -1 }).limit(50);
  return files.map(formatFile);
}

export async function moveFile(userId: string, fileId: string, newParentId: string | null, actorId: string) {
  const file = await FileNode.findOne({ _id: fileId, userId });
  if (!file) throw new Error('FILE_NOT_FOUND');

  const parentPath = newParentId
    ? (await FileNode.findOne({ _id: newParentId, userId }))?.path ?? '/'
    : '/';
  const newPath = parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;

  file.parentId = newParentId ? new Types.ObjectId(newParentId) : undefined;
  file.path = newPath;
  await file.save();

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.files, action: 'file_move', resourceId: fileId });
  emitToUser(userId, 'files:update', { action: 'moved', fileId });
  return formatFile(file);
}

export async function renameFile(userId: string, fileId: string, newName: string, actorId: string) {
  const file = await FileNode.findOne({ _id: fileId, userId });
  if (!file) throw new Error('FILE_NOT_FOUND');

  const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
  file.name = newName;
  file.path = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
  await file.save();

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.files, action: 'file_rename', resourceId: fileId });
  emitToUser(userId, 'files:update', { action: 'renamed', fileId });
  return formatFile(file);
}

export async function getFilesByCategory(userId: string, category: string) {
  const files = await FileNode.find({ userId, type: 'file' }).sort({ updatedAt: -1 }).limit(100);
  return files.map(formatFile).filter((f) => f.category === category);
}

export async function getRecentFiles(userId: string, limit = 20) {
  const files = await FileNode.find({ userId, type: 'file' }).sort({ updatedAt: -1 }).limit(limit);
  return files.map(formatFile);
}

export async function ensureSystemFolders(userId: string) {
  const folders = ['Documents', 'Downloads', 'Images', 'Videos', 'Audio'];
  for (const name of folders) {
    const exists = await FileNode.findOne({ userId, name, parentId: null, type: 'folder' });
    if (!exists) {
      await FileNode.create({ userId, name, type: 'folder', parentId: null, path: `/${name}` });
    }
  }
}

export async function previewFile(userId: string, fileId: string) {
  const file = await FileNode.findOne({ _id: fileId, userId, type: 'file' });
  if (!file) throw new Error('FILE_NOT_FOUND');
  const isPdf = file.mimeType?.includes('pdf');
  const isZip = file.mimeType?.includes('zip');
  return {
    id: file._id.toString(),
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    previewable: isPdf || file.mimeType?.startsWith('image/') || file.mimeType?.startsWith('text/'),
    isPdf,
    isZip,
    content: file.mimeType?.startsWith('text/') ? file.content : undefined,
  };
}

export { FAVORITES_KEY, RECENT_KEY };
