import { Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { PhonePermission } from '../../database/models/PhonePermission';
import type { PhonePermissionName } from '../../database/models/PhonePermission';
import {
  hasPermission,
  initPhone,
  getDashboard,
  updateSettings,
  listFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites,
  listBlocked,
  blockNumber,
  unblockNumber,
  searchContacts,
  getAuditLogs,
  AuditContext,
} from '../../services/phoneService';
import {
  getActiveCall,
  listCallHistory,
  getMissedCalls,
  makeCall,
  acceptCall,
  rejectCall,
  endCall,
  holdCall,
  resumeCall,
  muteCall,
  speakerCall,
  addConferenceParticipant,
  startRecording,
} from '../../services/callService';
import {
  listVoicemails,
  getVoicemail,
  markVoicemailRead,
  deleteVoicemail,
  sendToVoicemail,
  createVoicemailGreeting,
} from '../../services/voicemailService';
import {
  listEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  syncFromContacts,
  placeEmergencyCall,
  callEmergencyContact,
} from '../../services/emergencyService';

function auditCtx(req: AuthRequest, permission: PhonePermissionName, reason?: string): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: req.user!.role,
    permission,
    ipAddress: req.ip,
    deviceId: req.headers['x-device-id'] as string | undefined,
    reason,
  };
}

async function checkPerm(req: AuthRequest, permission: PhonePermissionName): Promise<void> {
  const allowed = await hasPermission(req.user!.userId, permission, req.user!.role);
  if (!allowed) throw new AppError(403, `Permission denied: ${permission}`);
}

function parseObjectId(id: string, label = 'id'): string {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, `Invalid ${label}`);
  return id;
}

export const getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const perms = await PhonePermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});

export const initPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await initPhone(req.user!.userId, auditCtx(req, 'view_dashboard'));
    res.json({ success: true, data: result });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Init failed');
  }
});

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_dashboard');
  const dashboard = await getDashboard(req.user!.userId);
  res.json({ success: true, data: dashboard });
});

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'manage_settings');
  const dashboard = await getDashboard(req.user!.userId);
  res.json({ success: true, data: dashboard.settings });
});

export const patchSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    callerIdEnabled: z.boolean().optional(),
    showMyNumber: z.boolean().optional(),
    autoRejectUnknown: z.boolean().optional(),
    silenceUnknownCallers: z.boolean().optional(),
    callWaiting: z.boolean().optional(),
    callForwardingEnabled: z.boolean().optional(),
    callForwardingNumber: z.string().optional(),
    voicemailEnabled: z.boolean().optional(),
    voicemailGreeting: z.string().max(500).optional(),
    recordCalls: z.boolean().optional(),
    hapticFeedback: z.boolean().optional(),
    dynamicIslandEnabled: z.boolean().optional(),
  });
  const data = schema.parse(req.body);
  try {
    const settings = await updateSettings(req.user!.userId, data, auditCtx(req, 'manage_settings'));
    res.json({ success: true, data: settings });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Update failed');
  }
});

export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'manage_favorites');
  const favorites = await listFavorites(req.user!.userId);
  res.json({ success: true, data: favorites });
});

export const postFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    phoneNumber: z.string().min(3),
    label: z.string().min(1).max(100),
    contactId: z.string().optional(),
    position: z.number().int().min(0).optional(),
  });
  const data = schema.parse(req.body);
  try {
    const fav = await addFavorite(req.user!.userId, data, auditCtx(req, 'manage_favorites'));
    res.status(201).json({ success: true, data: fav });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Failed');
  }
});

export const deleteFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await removeFavorite(req.user!.userId, parseObjectId(String(req.params.id), 'favorite id'), auditCtx(req, 'manage_favorites'));
    res.json({ success: true });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const reorderFavoritesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ orderedIds: z.array(z.string()) });
  const { orderedIds } = schema.parse(req.body);
  const favorites = await reorderFavorites(req.user!.userId, orderedIds, auditCtx(req, 'manage_favorites'));
  res.json({ success: true, data: favorites });
});

export const getBlocked = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'block_numbers');
  const blocked = await listBlocked(req.user!.userId);
  res.json({ success: true, data: blocked });
});

export const postBlocked = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    phoneNumber: z.string().min(3),
    label: z.string().optional(),
    reason: z.string().optional(),
    blockType: z.enum(['call', 'sms', 'both']).optional(),
  });
  const data = schema.parse(req.body);
  try {
    const blocked = await blockNumber(req.user!.userId, data, auditCtx(req, 'block_numbers'));
    res.status(201).json({ success: true, data: blocked });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Failed');
  }
});

export const deleteBlocked = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await unblockNumber(req.user!.userId, parseObjectId(String(req.params.id), 'blocked id'), auditCtx(req, 'block_numbers'));
    res.json({ success: true });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const searchContactsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  const results = await searchContacts(req.user!.userId, q, auditCtx(req, 'view_dashboard'));
  res.json({ success: true, data: results });
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_audit_logs');
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const logs = await getAuditLogs(req.user!.userId, limit);
  res.json({ success: true, data: logs });
});

export const getActiveCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_dashboard');
  const active = await getActiveCall(req.user!.userId);
  res.json({ success: true, data: active });
});

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_recents');
  const direction = req.query.direction ? String(req.query.direction) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const page = Number(req.query.page ?? 0);
  const limit = Number(req.query.limit ?? 50);
  const history = await listCallHistory(req.user!.userId, { direction, status, page, limit });
  res.json({ success: true, data: history });
});

export const getMissed = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_recents');
  const missed = await getMissedCalls(req.user!.userId);
  res.json({ success: true, data: missed });
});

export const postCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    phoneNumber: z.string().min(3),
    contactId: z.string().optional(),
  });
  const data = schema.parse(req.body);
  try {
    const result = await makeCall(req.user!.userId, data, auditCtx(req, 'make_call'));
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Call failed');
  }
});

export const acceptCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const call = await acceptCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'receive_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Accept failed');
  }
});

export const rejectCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const call = await rejectCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'receive_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Reject failed');
  }
});

export const endCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const call = await endCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'end_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'End failed');
  }
});

export const holdCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const call = await holdCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'end_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Hold failed');
  }
});

export const resumeCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const call = await resumeCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'end_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Resume failed');
  }
});

export const muteCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ muted: z.boolean() });
  const { muted } = schema.parse(req.body);
  try {
    const call = await muteCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), muted, auditCtx(req, 'end_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Mute failed');
  }
});

export const speakerCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ speaker: z.boolean() });
  const { speaker } = schema.parse(req.body);
  try {
    const call = await speakerCall(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), speaker, auditCtx(req, 'end_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Speaker failed');
  }
});

export const conferenceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    phoneNumber: z.string().min(3),
    contactId: z.string().optional(),
  });
  const data = schema.parse(req.body);
  try {
    const call = await addConferenceParticipant(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), data, auditCtx(req, 'conference_call'));
    res.json({ success: true, data: call });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Conference failed');
  }
});

export const recordCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const recording = await startRecording(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'record_call'));
    res.json({ success: true, data: recording });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Record failed');
  }
});

export const getVoicemailsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_voicemail');
  const page = Number(req.query.page ?? 0);
  const limit = Number(req.query.limit ?? 30);
  const voicemails = await listVoicemails(req.user!.userId, page, limit);
  res.json({ success: true, data: voicemails });
});

export const getVoicemailHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_voicemail');
  try {
    const vm = await getVoicemail(req.user!.userId, parseObjectId(String(req.params.id), 'voicemail id'));
    res.json({ success: true, data: vm });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const readVoicemailHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const vm = await markVoicemailRead(req.user!.userId, parseObjectId(String(req.params.id), 'voicemail id'), auditCtx(req, 'view_voicemail'));
    res.json({ success: true, data: vm });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const deleteVoicemailHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await deleteVoicemail(req.user!.userId, parseObjectId(String(req.params.id), 'voicemail id'), auditCtx(req, 'manage_voicemail'));
    res.json({ success: true });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const voicemailRedirectHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const vm = await sendToVoicemail(req.user!.userId, parseObjectId(String(req.params.id), 'call id'), auditCtx(req, 'manage_voicemail'));
    res.json({ success: true, data: vm });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Failed');
  }
});

export const voicemailGreetingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ greeting: z.string().min(1).max(500) });
  const { greeting } = schema.parse(req.body);
  const result = await createVoicemailGreeting(req.user!.userId, greeting, auditCtx(req, 'manage_voicemail'));
  res.json({ success: true, data: result });
});

export const getEmergencyContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'emergency_call');
  const contacts = await listEmergencyContacts(req.user!.userId);
  res.json({ success: true, data: contacts });
});

export const postEmergencyContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().min(3),
    relationship: z.string().optional(),
    contactId: z.string().optional(),
    priority: z.number().int().min(1).optional(),
  });
  const data = schema.parse(req.body);
  try {
    const contact = await addEmergencyContact(req.user!.userId, data, auditCtx(req, 'emergency_call'));
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Failed');
  }
});

export const deleteEmergencyContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await removeEmergencyContact(req.user!.userId, parseObjectId(String(req.params.id), 'emergency contact id'), auditCtx(req, 'emergency_call'));
    res.json({ success: true });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Not found');
  }
});

export const syncEmergencyContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contacts = await syncFromContacts(req.user!.userId, auditCtx(req, 'emergency_call'));
  res.json({ success: true, data: contacts });
});

export const emergencyCallHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await placeEmergencyCall(req.user!.userId, auditCtx(req, 'emergency_call'));
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Emergency call failed');
  }
});

export const callEmergencyContactHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await callEmergencyContact(req.user!.userId, parseObjectId(String(req.params.id), 'emergency contact id'), auditCtx(req, 'emergency_call'));
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Call failed');
  }
});
