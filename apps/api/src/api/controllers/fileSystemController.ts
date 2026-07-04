import { Response } from 'express';
import { FileNode } from '../../database/models/FileNode';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const listFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { parentId } = req.query;
  const filter: Record<string, unknown> = { userId: req.user!.userId };

  if (parentId === 'root' || !parentId) {
    filter.parentId = null;
  } else {
    filter.parentId = parentId;
  }

  const files = await FileNode.find(filter).sort({ type: -1, name: 1 });

  res.json({
    success: true,
    data: files.map(formatFile),
  });
});

export const createFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, parentId } = req.body as { name: string; parentId?: string };
  const parentPath = parentId
    ? (await FileNode.findOne({ _id: parentId, userId: req.user!.userId }))?.path ?? '/'
    : '/';

  const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

  const existing = await FileNode.findOne({
    userId: req.user!.userId,
    parentId: parentId ?? null,
    name,
  });
  if (existing) {
    throw new AppError(409, 'Folder already exists');
  }

  const folder = await FileNode.create({
    userId: req.user!.userId,
    name,
    type: 'folder',
    parentId: parentId ?? null,
    path,
  });

  res.status(201).json({ success: true, data: formatFile(folder) });
});

export const createFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, parentId, mimeType, content } = req.body as {
    name: string;
    parentId?: string;
    mimeType?: string;
    content?: string;
  };

  const parentPath = parentId
    ? (await FileNode.findOne({ _id: parentId, userId: req.user!.userId }))?.path ?? '/'
    : '/';

  const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

  const file = await FileNode.create({
    userId: req.user!.userId,
    name,
    type: 'file',
    mimeType: mimeType ?? 'text/plain',
    size: content?.length ?? 0,
    parentId: parentId ?? null,
    path,
    content,
  });

  res.status(201).json({ success: true, data: formatFile(file) });
});

export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const node = await FileNode.findOne({ _id: id, userId: req.user!.userId });
  if (!node) {
    throw new AppError(404, 'File not found');
  }

  if (node.type === 'folder') {
    await FileNode.deleteMany({
      userId: req.user!.userId,
      path: { $regex: `^${node.path}(/|$)` },
    });
  }

  await FileNode.deleteOne({ _id: id });
  res.json({ success: true, message: 'Deleted successfully' });
});

function formatFile(file: InstanceType<typeof FileNode>) {
  return {
    id: file._id.toString(),
    name: file.name,
    type: file.type,
    mimeType: file.mimeType,
    size: file.size,
    parentId: file.parentId?.toString() ?? null,
    path: file.path,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}
