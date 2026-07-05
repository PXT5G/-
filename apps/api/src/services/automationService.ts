import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Automation, AutomationRun } from '../database/models/Automation';
import { AUTOMATION_APP_BUNDLE, type AutomationStatus, type TriggerType, type AutomationActionType } from '../constants/automation';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';

function autoId() { return `AUTO-${uuidv4().slice(0, 8).toUpperCase()}`; }
function runId() { return `RUN-${uuidv4().slice(0, 10).toUpperCase()}`; }
function trigId() { return `TRG-${uuidv4().slice(0, 6).toUpperCase()}`; }
function actId() { return `AAC-${uuidv4().slice(0, 6).toUpperCase()}`; }

async function assertAutomation(userId: string) {
  const allowed = await checkPermission(userId, AUTOMATION_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('AUTOMATION_PERMISSION_DENIED');
}

export async function initializeAutomation(userId: string, actorId: string) {
  await assertAutomation(userId);
  const count = await Automation.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (count === 0) {
    await createAutomation(userId, {
      name: 'Good Morning',
      description: 'Show weather and calendar when charging starts',
      triggers: [{ type: 'charging', config: {} }],
      actions: [{ type: 'open_app', config: { appId: 'com.gulfos.weather' }, order: 0 }],
    }, actorId);
  }
  return { initialized: true };
}

export async function listAutomations(userId: string, status?: AutomationStatus) {
  await assertAutomation(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (status) filter.status = status;
  const automations = await Automation.find(filter).sort({ updatedAt: -1 });
  return automations.map(formatAutomation);
}

export async function getAutomation(userId: string, automationId: string) {
  await assertAutomation(userId);
  const auto = await Automation.findOne({ automationId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!auto) throw new Error('AUTOMATION_NOT_FOUND');
  return formatAutomation(auto);
}

export async function createAutomation(
  userId: string,
  input: {
    name: string;
    description?: string;
    triggers: { type: TriggerType; config: Record<string, unknown> }[];
    conditions?: { field: string; operator: string; value: unknown }[];
    actions: { type: AutomationActionType; config: Record<string, unknown>; order: number }[];
  },
  actorId: string
) {
  await assertAutomation(userId);
  const doc = await Automation.create({
    automationId: autoId(),
    userId: new Types.ObjectId(userId),
    name: input.name,
    description: input.description,
    status: 'draft',
    triggers: input.triggers.map((t) => ({ triggerId: trigId(), type: t.type, config: t.config })),
    conditions: (input.conditions ?? []).map((c) => ({ conditionId: trigId(), ...c })),
    actions: input.actions.map((a) => ({ actionId: actId(), type: a.type, config: a.config, order: a.order })),
    createdBy: new Types.ObjectId(actorId),
  });
  emitToUser(userId, 'automation:created', { automationId: doc.automationId });
  await logAudit({ userId, actorId, action: 'automation_create', resource: 'automation', resourceId: doc.automationId });
  return formatAutomation(doc);
}

export async function updateAutomation(
  userId: string,
  automationId: string,
  input: Partial<{ name: string; description: string; status: AutomationStatus }>,
  actorId: string
) {
  await assertAutomation(userId);
  const auto = await Automation.findOne({ automationId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!auto) throw new Error('AUTOMATION_NOT_FOUND');
  if (input.name) auto.name = input.name;
  if (input.description !== undefined) auto.description = input.description;
  if (input.status) auto.status = input.status;
  auto.updatedBy = new Types.ObjectId(actorId);
  await auto.save();
  emitToUser(userId, 'automation:updated', { automationId });
  return formatAutomation(auto);
}

export async function deleteAutomation(userId: string, automationId: string, actorId: string) {
  await assertAutomation(userId);
  const auto = await Automation.findOne({ automationId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!auto) throw new Error('AUTOMATION_NOT_FOUND');
  auto.deletedAt = new Date();
  await auto.save();
  await logAudit({ userId, actorId, action: 'automation_delete', resource: 'automation', resourceId: automationId });
  return { deleted: true };
}

export async function runAutomation(userId: string, automationId: string, actorId: string) {
  await assertAutomation(userId);
  const auto = await Automation.findOne({ automationId, userId: new Types.ObjectId(userId), deletedAt: null, status: 'active' });
  if (!auto) {
    const draft = await Automation.findOne({ automationId, userId: new Types.ObjectId(userId), deletedAt: null });
    if (draft && draft.status === 'draft') throw new Error('AUTOMATION_NOT_ACTIVE');
    throw new Error('AUTOMATION_NOT_FOUND');
  }

  const rid = runId();
  const run = await AutomationRun.create({
    runId: rid,
    automationId,
    userId: new Types.ObjectId(userId),
    status: 'running',
    startedAt: new Date(),
    logs: [{ timestamp: new Date(), message: 'Automation started', level: 'info' }],
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'automation:running', { automationId, runId: rid });

  let actionsExecuted = 0;
  try {
    for (const action of auto.actions.sort((a, b) => a.order - b.order)) {
      await executeAutomationAction(userId, action.type, action.config);
      actionsExecuted++;
      run.logs.push({ timestamp: new Date(), message: `Executed: ${action.type}`, level: 'info' });
    }
    run.status = 'completed';
    run.completedAt = new Date();
    run.durationMs = run.completedAt.getTime() - run.startedAt.getTime();
    run.actionsExecuted = actionsExecuted;
    await run.save();

    auto.runCount += 1;
    auto.lastRunAt = new Date();
    await auto.save();

    emitToUser(userId, 'automation:completed', { automationId, runId: rid });
    return { runId: rid, status: 'completed', actionsExecuted };
  } catch (err) {
    run.status = 'failed';
    run.errorMessage = err instanceof Error ? err.message : 'Unknown error';
    run.completedAt = new Date();
    await run.save();
    emitToUser(userId, 'automation:failed', { automationId, runId: rid, error: run.errorMessage });
    throw err;
  }
}

async function executeAutomationAction(userId: string, type: AutomationActionType, config: Record<string, unknown>) {
  switch (type) {
    case 'open_app':
      emitToUser(userId, 'assistant:action', { type: 'open_app', config });
      break;
    case 'create_notification': {
      const { enqueueNotification } = await import('./notificationBrokerService');
      await enqueueNotification({
        userId,
        appId: AUTOMATION_APP_BUNDLE,
        title: String(config.title ?? 'Automation'),
        body: String(config.body ?? 'Automation triggered'),
        priority: 'normal',
      });
      break;
    }
    case 'toggle_wifi':
    case 'toggle_bluetooth':
    case 'adjust_brightness':
    case 'adjust_volume':
      emitToUser(userId, 'assistant:action', { type, config });
      break;
    default:
      break;
  }
}

export async function getRunHistory(userId: string, automationId?: string, limit = 20) {
  await assertAutomation(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (automationId) filter.automationId = automationId;
  const runs = await AutomationRun.find(filter).sort({ startedAt: -1 }).limit(limit);
  return runs.map((r) => ({
    runId: r.runId,
    automationId: r.automationId,
    status: r.status,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    durationMs: r.durationMs,
    actionsExecuted: r.actionsExecuted,
    errorMessage: r.errorMessage,
  }));
}

export async function activateAutomation(userId: string, automationId: string, actorId: string) {
  return updateAutomation(userId, automationId, { status: 'active' }, actorId);
}

function formatAutomation(a: InstanceType<typeof Automation>) {
  return {
    automationId: a.automationId,
    name: a.name,
    description: a.description,
    status: a.status,
    triggers: a.triggers,
    conditions: a.conditions,
    actions: a.actions,
    runCount: a.runCount,
    lastRunAt: a.lastRunAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export { AUTOMATION_APP_BUNDLE };
