import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  sendMessage,
  getMessages,
  getMessage,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  forwardMessage,
  searchCommunication,
  createAnnouncement,
  initializeCommunication,
} from '../../services/communicationService';
import {
  createConversation,
  getUserConversations,
  getConversation,
  getConversationMembers,
  getOrCreatePrivateConversation,
  addMember,
  pinMessage,
} from '../../services/conversationService';
import {
  getPresence,
  setPresence,
  setInvisible,
  setDoNotDisturb,
  getPresenceForUsers,
} from '../../services/presenceService';
import { startTyping, stopTyping, getTypingUsers } from '../../services/typingService';
import { markMessageRead, markConversationRead } from '../../services/readReceiptService';
import { addReaction, removeReaction } from '../../services/reactionService';
import {
  initiateAttachmentUpload,
  uploadAttachmentChunk,
  getAttachment,
} from '../../services/attachmentService';
import {
  queueOfflineMessage,
  syncOfflineQueue,
  resolveConflict,
  getSyncStatus,
} from '../../services/syncService';
import { registerTrustedDevice } from '../../services/encryptionService';
import { MESSAGE_TYPES, CONTENT_TYPES, CONVERSATION_TYPES, PRESENCE_STATES } from '../../constants/communication';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const appIdSchema = z.object({ appId: z.string().default('com.gulfos.communication') });

// ─── Init ───────────────────────────────────────────────────────────────────

export const initializeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await initializeCommunication(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Conversations ──────────────────────────────────────────────────────────

export const createConversationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const body = z.object({
    type: z.enum(CONVERSATION_TYPES as unknown as [string, ...string[]]),
    title: z.string().optional(),
    memberIds: z.array(z.string()).min(1),
    description: z.string().optional(),
    announcementOnly: z.boolean().optional(),
  }).parse(req.body);
  const data = await createConversation({
    ...body,
    type: body.type as never,
    creatorId: req.user!.userId,
    appId,
  });
  res.status(201).json({ success: true, data });
});

export const getConversationsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
  const data = await getUserConversations(req.user!.userId, limit, offset);
  res.json({ success: true, data });
});

export const getConversationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await getConversation(param(req.params.id), req.user!.userId);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    if (err instanceof Error && err.message === 'CONVERSATION_NOT_FOUND') throw new AppError(404, 'Conversation not found');
    throw err;
  }
});

export const getConversationMembersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getConversationMembers(param(req.params.id));
  res.json({ success: true, data });
});

export const getOrCreatePrivateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { otherUserId } = z.object({ otherUserId: z.string() }).parse(req.body);
  const data = await getOrCreatePrivateConversation(req.user!.userId, otherUserId, appId);
  res.json({ success: true, data });
});

export const addMemberHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { memberId } = z.object({ memberId: z.string() }).parse(req.body);
  try {
    await addMember(param(req.params.id), req.user!.userId, memberId, appId, getActorId(req));
    res.json({ success: true, data: { added: true, memberId } });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') throw new AppError(403, 'Permission denied');
    throw err;
  }
});

// ─── Messages ───────────────────────────────────────────────────────────────

export const sendMessageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const body = z.object({
    conversationId: z.string(),
    body: z.string().max(10000),
    messageType: z.enum(MESSAGE_TYPES as unknown as [string, ...string[]]).optional(),
    contentType: z.enum(CONTENT_TYPES as unknown as [string, ...string[]]).optional(),
    replyToMessageId: z.string().optional(),
    forwardFromMessageId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    scheduledAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    autoDeleteAt: z.string().datetime().optional(),
    silent: z.boolean().optional(),
    hidden: z.boolean().optional(),
    clientMessageId: z.string().optional(),
  }).parse(req.body);

  try {
    const data = await sendMessage({
      userId: req.user!.userId,
      appId,
      conversationId: body.conversationId,
      body: body.body,
      messageType: body.messageType as never,
      contentType: body.contentType as never,
      replyToMessageId: body.replyToMessageId,
      forwardFromMessageId: body.forwardFromMessageId,
      metadata: body.metadata,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      autoDeleteAt: body.autoDeleteAt ? new Date(body.autoDeleteAt) : undefined,
      silent: body.silent,
      hidden: body.hidden,
      clientMessageId: body.clientMessageId,
      actorId: getActorId(req),
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') throw new AppError(403, 'Permission denied');
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    if (err instanceof Error && err.message === 'NO_NETWORK') throw new AppError(503, 'No network connection');
    throw err;
  }
});

export const getMessagesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const before = req.query.before as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  try {
    const data = await getMessages(req.user!.userId, param(req.params.id), { before, limit });
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    throw err;
  }
});

export const getMessageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await getMessage(param(req.params.id), req.user!.userId);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'MESSAGE_NOT_FOUND') throw new AppError(404, 'Message not found');
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    throw err;
  }
});

export const editMessageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { body } = z.object({ body: z.string().max(10000) }).parse(req.body);
  try {
    const data = await editMessage(param(req.params.id), req.user!.userId, body, appId, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'MESSAGE_NOT_FOUND') throw new AppError(404, 'Message not found');
    throw err;
  }
});

export const deleteForMeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const data = await deleteMessageForMe(param(req.params.id), req.user!.userId, appId, getActorId(req));
  res.json({ success: true, data });
});

export const deleteForEveryoneHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  try {
    const data = await deleteMessageForEveryone(param(req.params.id), req.user!.userId, appId, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'MESSAGE_NOT_FOUND') throw new AppError(404, 'Message not found');
    throw err;
  }
});

export const forwardMessageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { targetConversationId } = z.object({ targetConversationId: z.string() }).parse(req.body);
  const data = await forwardMessage(param(req.params.id), req.user!.userId, targetConversationId, appId, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const pinMessageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const data = await pinMessage(param(req.params.conversationId), param(req.params.messageId), req.user!.userId, appId, getActorId(req));
  res.json({ success: true, data });
});

// ─── Presence ───────────────────────────────────────────────────────────────

export const getPresenceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req.query.userId as string) ?? req.user!.userId;
  const data = await getPresence(userId);
  res.json({ success: true, data });
});

export const setPresenceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    state: z.enum(PRESENCE_STATES as unknown as [string, ...string[]]),
    customStatus: z.string().optional(),
    conversationId: z.string().optional(),
  }).parse(req.body);
  const data = await setPresence(req.user!.userId, body.state as never, {
    customStatus: body.customStatus,
    conversationId: body.conversationId,
    actorId: getActorId(req),
  });
  res.json({ success: true, data });
});

export const setInvisibleHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { invisible } = z.object({ invisible: z.boolean() }).parse(req.body);
  const data = await setInvisible(req.user!.userId, invisible, getActorId(req));
  res.json({ success: true, data });
});

export const setDndHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  const data = await setDoNotDisturb(req.user!.userId, enabled, getActorId(req));
  res.json({ success: true, data });
});

// ─── Typing ─────────────────────────────────────────────────────────────────

export const startTypingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recording } = z.object({ recording: z.boolean().optional() }).parse(req.body);
  try {
    const data = await startTyping(req.user!.userId, param(req.params.id), { recording, actorId: getActorId(req) });
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    throw err;
  }
});

export const stopTypingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stopTyping(req.user!.userId, param(req.params.id), getActorId(req));
  res.json({ success: true, data });
});

export const getTypingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getTypingUsers(param(req.params.id));
  res.json({ success: true, data });
});

// ─── Read Receipts ──────────────────────────────────────────────────────────

export const markReadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await markMessageRead(req.user!.userId, param(req.params.messageId), param(req.params.conversationId), getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') throw new AppError(403, 'Not a conversation member');
    throw err;
  }
});

export const markConversationReadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await markConversationRead(req.user!.userId, param(req.params.id), getActorId(req));
  res.json({ success: true, data });
});

// ─── Reactions ──────────────────────────────────────────────────────────────

export const addReactionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body);
  const data = await addReaction(req.user!.userId, param(req.params.messageId), param(req.params.conversationId), emoji, appId, getActorId(req));
  res.json({ success: true, data });
});

export const removeReactionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const { emoji } = z.object({ emoji: z.string() }).parse(req.body);
  const data = await removeReaction(req.user!.userId, param(req.params.messageId), emoji, appId, getActorId(req));
  res.json({ success: true, data });
});

// ─── Attachments ────────────────────────────────────────────────────────────

export const initiateUploadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const body = z.object({
    conversationId: z.string(),
    messageId: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().positive(),
  }).parse(req.body);
  try {
    const data = await initiateAttachmentUpload({ ...body, userId: req.user!.userId, appId, actorId: getActorId(req) });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') throw new AppError(403, 'Permission denied');
    if (err instanceof Error && err.message === 'FILE_TOO_LARGE') throw new AppError(413, 'File too large');
    throw err;
  }
});

export const uploadChunkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const chunkIndex = parseInt(param(req.params.chunkIndex), 10);
  const dataBuffer = Buffer.from(req.body.data as string, 'base64');
  try {
    const data = await uploadAttachmentChunk(req.user!.userId, param(req.params.id), chunkIndex, dataBuffer, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'ATTACHMENT_NOT_FOUND') throw new AppError(404, 'Attachment not found');
    throw err;
  }
});

export const getAttachmentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await getAttachment(param(req.params.id), req.user!.userId);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'ATTACHMENT_NOT_FOUND') throw new AppError(404, 'Attachment not found');
    throw err;
  }
});

// ─── Search ─────────────────────────────────────────────────────────────────

export const searchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) ?? '';
  const type = req.query.type as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const data = await searchCommunication(req.user!.userId, q, { type, limit });
  res.json({ success: true, data });
});

// ─── Sync / Offline ─────────────────────────────────────────────────────────

export const queueOfflineHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ clientMessageId: z.string(), payload: z.record(z.unknown()) }).parse(req.body);
  const data = await queueOfflineMessage(req.user!.userId, body.clientMessageId, body.payload, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const syncHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const synced = await syncOfflineQueue(req.user!.userId);
  res.json({ success: true, data: { synced } });
});

export const syncStatusHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getSyncStatus(req.user!.userId);
  res.json({ success: true, data });
});

export const resolveConflictHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    clientMessageId: z.string(),
    resolution: z.enum(['client_wins', 'server_wins', 'merged']),
    mergedPayload: z.record(z.unknown()).optional(),
  }).parse(req.body);
  const data = await resolveConflict(req.user!.userId, body.clientMessageId, body.resolution, body.mergedPayload);
  res.json({ success: true, data });
});

// ─── Encryption / Devices ───────────────────────────────────────────────────

export const registerDeviceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { conversationId, deviceId } = z.object({ conversationId: z.string(), deviceId: z.string() }).parse(req.body);
  const data = await registerTrustedDevice(conversationId, deviceId, getActorId(req));
  res.json({ success: true, data: { keyId: data.keyId, trustedDevices: data.trustedDeviceIds.length } });
});

// ─── Announcements ──────────────────────────────────────────────────────────

export const createAnnouncementHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  const body = z.object({
    conversationId: z.string(),
    title: z.string(),
    body: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  }).parse(req.body);
  const data = await createAnnouncement({ ...body, userId: req.user!.userId, appId, actorId: getActorId(req) });
  res.status(201).json({ success: true, data });
});
