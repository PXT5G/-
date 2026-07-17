import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Note } from '../database/models/Note';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { emitToUser } from './socketService';

function formatNote(n: InstanceType<typeof Note>) {
  return {
    noteId: n.noteId,
    title: n.title,
    content: n.content,
    folderId: n.folderId,
    pinned: n.pinned,
    locked: n.locked,
    checklist: n.checklist,
    images: n.images,
    voiceNoteIds: n.voiceNoteIds,
    updatedAt: n.updatedAt.toISOString(),
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listNotes(userId: string, folderId?: string, q?: string) {
  const query: Record<string, unknown> = { userId, deletedAt: null };
  if (folderId) query.folderId = folderId;
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } },
    ];
  }
  const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 }).limit(100);
  return notes.map(formatNote);
}

export async function createNote(
  userId: string,
  params: { title?: string; content?: string; folderId?: string; checklist?: Array<{ id: string; text: string; checked: boolean }> },
  actorId: string
) {
  const noteId = uuidv4();
  const note = await Note.create({
    userId: new Types.ObjectId(userId),
    noteId,
    title: params.title ?? 'Untitled',
    content: params.content ?? '',
    folderId: params.folderId,
    checklist: params.checklist ?? [],
    createdBy: new Types.ObjectId(actorId),
  });
  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.notes, action: 'note_create', resourceId: noteId });
  emitToUser(userId, 'notes:update', { action: 'created', noteId });
  return formatNote(note);
}

export async function updateNote(
  userId: string,
  noteId: string,
  updates: Partial<{ title: string; content: string; pinned: boolean; locked: boolean; checklist: Array<{ id: string; text: string; checked: boolean }>; images: string[] }>,
  actorId: string
) {
  const note = await Note.findOneAndUpdate(
    { userId, noteId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(actorId) },
    { new: true }
  );
  if (!note) throw new Error('NOTE_NOT_FOUND');
  emitToUser(userId, 'notes:update', { action: 'updated', noteId });
  return formatNote(note);
}

export async function deleteNote(userId: string, noteId: string, actorId: string) {
  await Note.findOneAndUpdate({ userId, noteId }, { deletedAt: new Date() });
  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.notes, action: 'note_delete', resourceId: noteId });
  emitToUser(userId, 'notes:update', { action: 'deleted', noteId });
  return { deleted: true };
}

export async function getFolders(userId: string) {
  const notes = await Note.find({ userId, deletedAt: null, folderId: { $exists: true, $ne: null } });
  const folders = new Map<string, number>();
  for (const n of notes) {
    if (n.folderId) folders.set(n.folderId, (folders.get(n.folderId) ?? 0) + 1);
  }
  return Array.from(folders.entries()).map(([folderId, count]) => ({ folderId, count }));
}
