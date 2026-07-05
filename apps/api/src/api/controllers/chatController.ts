import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  CHAT_ROLES,
  CHAT_CALL_TYPES,
  CHAT_PRIVACY_LEVELS,
  CHAT_CONVERSATION_KINDS,
} from '../../constants/chat';
import * as chatService from '../../services/chatService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'GULF Chat not installed'],
    CHAT_NOT_INITIALIZED: [404, 'Chat not initialized'],
    USER_BLOCKED: [403, 'User blocked'],
    USER_NOT_FOUND: [404, 'User not found'],
    REQUEST_NOT_FOUND: [404, 'Request not found'],
    POLL_NOT_FOUND: [404, 'Poll not found'],
    CALL_NOT_FOUND: [404, 'Call not found'],
    NOT_IN_CALL: [404, 'Not in call'],
    INVALID_INVITE: [404, 'Invalid invite link'],
    INVITE_EXPIRED: [410, 'Invite link expired'],
    INVITE_EXHAUSTED: [410, 'Invite link exhausted'],
    NOT_A_MEMBER: [403, 'Not a conversation member'],
    MESSAGE_NOT_FOUND: [404, 'Message not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function paramId(req: { params: Record<string, string | string[] | undefined> }, key: string): string {
  return String(req.params[key]);
}

function deviceUuid(req: AuthRequest) {
  return req.headers['x-device-uuid'] as string | undefined;
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.initializeChat(req.user!.userId, req.user!.role, deviceUuid(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const inbox = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.getInbox(req.user!.userId, req.user!.role, {
      archived: req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined,
      unreadOnly: req.query.unreadOnly === 'true',
      favorites: req.query.favorites === 'true',
    });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPrivate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ userId: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.createPrivateChat(req.user!.userId, req.user!.role, body.userId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    memberIds: z.array(z.string()),
    description: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.createGroupChat(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createChannel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.createChannel(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCommunity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ name: z.string().min(1), description: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await chatService.createCommunity(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createBroadcast = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ title: z.string().min(1), memberIds: z.array(z.string()) }).parse(req.body ?? {});
  try {
    const data = await chatService.createBroadcastList(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.getConversationDetail(req.user!.userId, req.user!.role, paramId(req, 'conversationId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateMeta = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    archived: z.boolean().optional(),
    favorite: z.boolean().optional(),
    hidden: z.boolean().optional(),
    locked: z.boolean().optional(),
    priority: z.boolean().optional(),
    draft: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.updateConversationMeta(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const pinConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ pinned: z.boolean() }).parse(req.body ?? {});
  try {
    const data = await chatService.pinChat(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), body.pinned);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    conversationId: z.string().min(1),
    body: z.string().min(1),
    contentType: z.string().optional(),
    messageType: z.string().optional(),
    replyToMessageId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    scheduledAt: z.string().optional(),
    autoDeleteAt: z.string().optional(),
    silent: z.boolean().optional(),
    clientMessageId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.sendChatMessage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sendRichMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    conversationId: z.string().min(1),
    richType: z.string().min(1),
    data: z.record(z.unknown()),
    replyToMessageId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.sendRichMessage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const before = req.query.before as string | undefined;
  try {
    const data = await chatService.getChatMessages(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), before);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const editMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ body: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.editChatMessage(req.user!.userId, req.user!.role, paramId(req, 'messageId'), body.body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ forEveryone: z.boolean().default(false) }).parse(req.body ?? {});
  try {
    const data = await chatService.deleteChatMessage(req.user!.userId, req.user!.role, paramId(req, 'messageId'), body.forEveryone);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const forwardMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ targetConversationId: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.forwardChatMessage(req.user!.userId, req.user!.role, paramId(req, 'messageId'), body.targetConversationId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const addReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ conversationId: z.string().min(1), emoji: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.reactToMessage(req.user!.userId, req.user!.role, paramId(req, 'messageId'), body.conversationId, body.emoji);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const removeReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const emoji = String(req.query.emoji ?? '');
  try {
    const data = await chatService.removeReactionFromMessage(req.user!.userId, req.user!.role, paramId(req, 'messageId'), emoji);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  const type = req.query.type as string | undefined;
  try {
    const data = await chatService.searchChats(req.user!.userId, req.user!.role, q, type);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const messageRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.listMessageRequests(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sendMessageRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ toUserId: z.string().min(1), message: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.sendMessageRequest(req.user!.userId, req.user!.role, body.toUserId, body.message);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const respondMessageRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ action: z.enum(['accept', 'decline', 'block']) }).parse(req.body ?? {});
  try {
    const data = await chatService.respondMessageRequest(req.user!.userId, req.user!.role, paramId(req, 'requestId'), body.action);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    conversationId: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    multipleChoice: z.boolean().optional(),
    anonymous: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.createPoll(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const votePoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ optionId: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.votePoll(req.user!.userId, req.user!.role, paramId(req, 'pollId'), body.optionId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const stickers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const packId = req.query.packId as string | undefined;
  try {
    const data = await chatService.getStickers(packId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const blockedUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.listBlockedUsers(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ userId: z.string().min(1), reason: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await chatService.blockUser(req.user!.userId, req.user!.role, body.userId, body.reason);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const unblockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.unblockUser(req.user!.userId, req.user!.role, paramId(req, 'userId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const privacy = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.getPrivacySettings(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updatePrivacy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    lastSeen: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
    onlineStatus: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
    typingIndicator: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
    readReceipts: z.boolean().optional(),
    profileVisibility: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
    groupInvites: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
    callPrivacy: z.enum(CHAT_PRIVACY_LEVELS as unknown as [string, ...string[]]).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.updatePrivacySettings(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const startCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    conversationId: z.string().min(1),
    callType: z.enum(CHAT_CALL_TYPES as unknown as [string, ...string[]]),
    recording: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.startCall(req.user!.userId, req.user!.role, body as never);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    muted: z.boolean().optional(),
    onHold: z.boolean().optional(),
    speaker: z.boolean().optional(),
    videoEnabled: z.boolean().optional(),
    joined: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.updateCallParticipant(req.user!.userId, req.user!.role, paramId(req, 'callId'), body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const endCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.endCall(req.user!.userId, req.user!.role, paramId(req, 'callId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const callHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.getCallHistory(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ maxUses: z.number().optional() }).parse(req.body ?? {});
  try {
    const data = await chatService.createInviteLink(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), body.maxUses);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const joinInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ code: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await chatService.joinViaInvite(req.user!.userId, req.user!.role, body.code);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const joinRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.listJoinRequests(req.user!.userId, req.user!.role, paramId(req, 'conversationId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createJoinRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ message: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await chatService.createJoinRequest(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), body.message);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reviewJoinRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ action: z.enum(['approve', 'reject']) }).parse(req.body ?? {});
  try {
    const data = await chatService.reviewJoinRequest(req.user!.userId, req.user!.role, paramId(req, 'requestId'), body.action);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const trustedDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.listTrustedDevices(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const typing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ isTyping: z.boolean() }).parse(req.body ?? {});
  try {
    const data = await chatService.setTyping(req.user!.userId, paramId(req, 'conversationId'), body.isTyping);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const presence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.query.userId as string | undefined;
  try {
    const data = await chatService.getChatPresence(req.user!.userId, userId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updatePresence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ state: z.string().min(1), customStatus: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await chatService.updateChatPresence(req.user!.userId, body.state, body.customStatus);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const pinMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.pinChatMessage(req.user!.userId, req.user!.role, paramId(req, 'conversationId'), paramId(req, 'messageId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    displayName: z.string().optional(),
    about: z.string().optional(),
    avatarUrl: z.string().optional(),
    biometricLock: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.updateChatProfile(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await chatService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(CHAT_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await chatService.patchRbac(req.user!.userId, req.user!.role, body.role, body.permissions);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
