import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Shortcut, ShortcutHistory } from '../database/models/Shortcut';
import { SHORTCUTS_APP_BUNDLE } from '../constants/shortcuts';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';

function sid() { return `SHT-${uuidv4().slice(0, 8).toUpperCase()}`; }
function hid() { return `SHH-${uuidv4().slice(0, 8).toUpperCase()}`; }
function aid() { return `SAC-${uuidv4().slice(0, 6).toUpperCase()}`; }

async function assertShortcuts(userId: string) {
  const allowed = await checkPermission(userId, SHORTCUTS_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('SHORTCUTS_PERMISSION_DENIED');
}

export async function initializeShortcuts(userId: string, actorId: string) {
  await assertShortcuts(userId);
  const count = await Shortcut.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (count === 0) {
    await Shortcut.create({
      shortcutId: sid(),
      userId: new Types.ObjectId(userId),
      name: 'Good Morning',
      description: 'Open weather and calendar',
      icon: '🌅',
      actions: [
        { actionId: aid(), type: 'open_app', config: { appId: 'com.gulfos.weather' }, order: 0 },
        { actionId: aid(), type: 'open_app', config: { appId: 'com.gulfos.calendar' }, order: 1 },
      ],
      isPinned: true,
      createdBy: new Types.ObjectId(actorId),
    });
  }
  return { initialized: true };
}

export async function listShortcuts(userId: string) {
  await assertShortcuts(userId);
  const shortcuts = await Shortcut.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ isPinned: -1, lastRunAt: -1 });
  return shortcuts.map(formatShortcut);
}

export async function getShortcut(userId: string, shortcutId: string) {
  await assertShortcuts(userId);
  const s = await Shortcut.findOne({ shortcutId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!s) throw new Error('SHORTCUT_NOT_FOUND');
  return formatShortcut(s);
}

export async function createShortcut(userId: string, input: {
  name: string; description?: string; icon?: string; actions: { type: string; config: Record<string, unknown>; order: number }[];
}, actorId: string) {
  await assertShortcuts(userId);
  const doc = await Shortcut.create({
    shortcutId: sid(),
    userId: new Types.ObjectId(userId),
    name: input.name,
    description: input.description,
    icon: input.icon,
    actions: input.actions.map((a, i) => ({ actionId: aid(), type: a.type, config: a.config, order: a.order ?? i })),
    createdBy: new Types.ObjectId(actorId),
  });
  emitToUser(userId, 'shortcut:created', { shortcutId: doc.shortcutId });
  await logAudit({ userId, actorId, action: 'shortcut_create', resource: 'shortcut', resourceId: doc.shortcutId });
  return formatShortcut(doc);
}

export async function updateShortcut(userId: string, shortcutId: string, input: Partial<{ name: string; description: string; isPinned: boolean; isFavorite: boolean }>, actorId: string) {
  await assertShortcuts(userId);
  const s = await Shortcut.findOne({ shortcutId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!s) throw new Error('SHORTCUT_NOT_FOUND');
  if (input.name) s.name = input.name;
  if (input.description !== undefined) s.description = input.description;
  if (input.isPinned !== undefined) s.isPinned = input.isPinned;
  if (input.isFavorite !== undefined) s.isFavorite = input.isFavorite;
  s.updatedBy = new Types.ObjectId(actorId);
  await s.save();
  emitToUser(userId, 'shortcut:updated', { shortcutId });
  return formatShortcut(s);
}

export async function deleteShortcut(userId: string, shortcutId: string, actorId: string) {
  await assertShortcuts(userId);
  await Shortcut.findOneAndUpdate({ shortcutId, userId: new Types.ObjectId(userId) }, { deletedAt: new Date() });
  emitToUser(userId, 'shortcut:deleted', { shortcutId });
  return { deleted: true };
}

export async function runShortcut(userId: string, shortcutId: string, actorId: string) {
  await assertShortcuts(userId);
  const s = await Shortcut.findOne({ shortcutId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!s) throw new Error('SHORTCUT_NOT_FOUND');
  const start = Date.now();
  const output: Record<string, unknown>[] = [];
  try {
    for (const action of s.actions.sort((a, b) => a.order - b.order)) {
      const result = await executeShortcutAction(userId, action.type, action.config);
      output.push({ actionId: action.actionId, type: action.type, result });
    }
    s.runCount += 1;
    s.lastRunAt = new Date();
    await s.save();
    await ShortcutHistory.create({
      historyId: hid(),
      userId: new Types.ObjectId(userId),
      shortcutId,
      status: 'completed',
      durationMs: Date.now() - start,
      output: { actions: output },
    });
    emitToUser(userId, 'shortcut:run', { shortcutId, status: 'completed' });
    return { shortcutId, status: 'completed', output };
  } catch (err) {
    await ShortcutHistory.create({
      historyId: hid(),
      userId: new Types.ObjectId(userId),
      shortcutId,
      status: 'failed',
      durationMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    });
    emitToUser(userId, 'shortcut:run', { shortcutId, status: 'failed' });
    throw err;
  }
}

async function executeShortcutAction(userId: string, type: string, config: Record<string, unknown>) {
  switch (type) {
    case 'open_app':
      emitToUser(userId, 'assistant:action', { type: 'open_app', config });
      return { opened: config.appId };
    case 'run_automation':
      if (config.automationId) {
        const { runAutomation } = await import('./automationService');
        return runAutomation(userId, String(config.automationId), userId);
      }
      return { skipped: true };
    case 'run_assistant':
      if (config.message) {
        const { createConversation, sendMessage } = await import('./assistantService');
        const conv = await createConversation(userId, 'Shortcut', userId);
        return sendMessage(userId, conv.conversationId, String(config.message), userId);
      }
      return { skipped: true };
    case 'clipboard_copy':
      return { copied: config.text };
    case 'show_notification': {
      const { enqueueNotification } = await import('./notificationBrokerService');
      await enqueueNotification({
        userId, appId: SHORTCUTS_APP_BUNDLE,
        title: String(config.title ?? 'Shortcut'),
        body: String(config.body ?? 'Shortcut completed'),
        priority: 'normal',
      });
      return { notified: true };
    }
    default:
      return { type, executed: true };
  }
}

export async function getShortcutHistory(userId: string, limit = 20) {
  await assertShortcuts(userId);
  const history = await ShortcutHistory.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 }).limit(limit);
  return history.map((h) => ({
    historyId: h.historyId, shortcutId: h.shortcutId, status: h.status,
    durationMs: h.durationMs, createdAt: h.createdAt,
  }));
}

function formatShortcut(s: InstanceType<typeof Shortcut>) {
  return {
    shortcutId: s.shortcutId, name: s.name, description: s.description, icon: s.icon,
    actions: s.actions, isPinned: s.isPinned, isFavorite: s.isFavorite,
    runCount: s.runCount, lastRunAt: s.lastRunAt,
  };
}

export { SHORTCUTS_APP_BUNDLE };
