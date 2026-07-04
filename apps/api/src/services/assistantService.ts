import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { AssistantConversation } from '../database/models/AssistantConversation';
import { AssistantSession } from '../database/models/AssistantConversation';
import { AssistantAction } from '../database/models/AssistantAction';
import { ASSISTANT_APP_BUNDLE, type ActionType } from '../constants/assistant';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import { globalSearch } from './globalSearchService';

function convId() { return `CONV-${uuidv4().slice(0, 8).toUpperCase()}`; }
function sessId() { return `SESS-${uuidv4().slice(0, 8).toUpperCase()}`; }
function msgId() { return `MSG-${uuidv4().slice(0, 8).toUpperCase()}`; }
function actId() { return `ACT-${uuidv4().slice(0, 8).toUpperCase()}`; }

async function assertAssistant(userId: string) {
  const allowed = await checkPermission(userId, ASSISTANT_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('ASSISTANT_PERMISSION_DENIED');
}

export async function initializeAssistant(userId: string, actorId: string) {
  await assertAssistant(userId);
  await logAudit({ userId, actorId, action: 'assistant_initialize', resource: 'assistant' });
  emitToUser(userId, 'assistant:initialized', { ready: true });
  return { initialized: true };
}

export async function listConversations(userId: string, limit = 20) {
  await assertAssistant(userId);
  const convs = await AssistantConversation.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ lastMessageAt: -1, createdAt: -1 }).limit(limit);
  return convs.map((c) => ({
    conversationId: c.conversationId,
    title: c.title,
    summary: c.summary,
    messageCount: c.messageCount,
    lastMessageAt: c.lastMessageAt,
    isPinned: c.isPinned,
  }));
}

export async function createConversation(userId: string, title?: string, actorId?: string) {
  await assertAssistant(userId);
  const cid = convId();
  const conv = await AssistantConversation.create({
    conversationId: cid,
    userId: new Types.ObjectId(userId),
    title: title ?? 'New Conversation',
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
  const sid = sessId();
  await AssistantSession.create({
    sessionId: sid,
    userId: new Types.ObjectId(userId),
    conversationId: cid,
    messages: [],
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
  return { conversationId: cid, sessionId: sid, title: conv.title };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
  actorId: string
) {
  await assertAssistant(userId);
  const session = await AssistantSession.findOne({
    userId: new Types.ObjectId(userId),
    conversationId,
    deletedAt: null,
  });
  if (!session) throw new Error('SESSION_NOT_FOUND');

  const userMsg = { messageId: msgId(), role: 'user' as const, content, createdAt: new Date() };
  session.messages.push(userMsg);
  emitToUser(userId, 'assistant:thinking', { conversationId });

  const response = await generateAssistantResponse(userId, content, session.memory as Record<string, unknown> | undefined);
  const assistantMsg = { messageId: msgId(), role: 'assistant' as const, content: response.text, createdAt: new Date() };
  session.messages.push(assistantMsg);
  if (response.memory) session.memory = response.memory;
  await session.save();

  await AssistantConversation.findOneAndUpdate(
    { conversationId, userId: new Types.ObjectId(userId) },
    { $inc: { messageCount: 2 }, lastMessageAt: new Date(), title: session.messages.length <= 2 ? content.slice(0, 50) : undefined }
  );

  if (response.action) {
    await queueAction(userId, conversationId, session.sessionId, response.action, actorId);
  }

  emitToUser(userId, 'assistant:conversation', {
    conversationId,
    message: assistantMsg,
  });

  return { userMessage: userMsg, assistantMessage: assistantMsg, action: response.action };
}

async function generateAssistantResponse(
  userId: string,
  content: string,
  memory?: Record<string, unknown>
): Promise<{ text: string; action?: { type: ActionType; input: Record<string, unknown> }; memory?: Record<string, unknown> }> {
  const lower = content.toLowerCase();

  if (lower.includes('search') || lower.startsWith('find ')) {
    const query = content.replace(/^(search|find)\s+(for\s+)?/i, '').trim();
    const results = await globalSearch(userId, query);
    return {
      text: results.total > 0
        ? `I found ${results.total} results for "${query}". Top matches: ${results.results.slice(0, 3).map((r) => r.title).join(', ')}.`
        : `No results found for "${query}".`,
      memory: { ...memory, lastSearch: query, lastSearchResults: results.total },
    };
  }

  if (lower.includes('balance') || lower.includes('bank')) {
    try {
      const { getDashboard } = await import('./bankService');
      const dash = await getDashboard(userId);
      return { text: `Your total balance is ${dash.totalBalance.toLocaleString()} GULF across ${dash.accountCount} accounts.` };
    } catch {
      return { text: 'I could not access your bank accounts. Please ensure the Bank app is set up.' };
    }
  }

  if (lower.includes('weather')) {
    try {
      const { getWeather } = await import('./weatherService');
      const weather = await getWeather(userId);
      const current = weather?.current as Record<string, unknown> | undefined;
      return { text: `Current weather: ${current?.label ?? 'Clear'}, ${current?.tempC ?? 24}°C.` };
    } catch {
      return { text: 'Weather data is currently unavailable.' };
    }
  }

  if (lower.includes('call ') || lower.startsWith('dial ')) {
    const number = content.replace(/^(call|dial)\s+/i, '').trim();
    return {
      text: `I'll initiate a call to ${number}. Please confirm.`,
      action: { type: 'call_contact', input: { number } },
    };
  }

  if (lower.includes('open ') && lower.includes('app')) {
    const appName = content.replace(/open\s+(the\s+)?/i, '').replace(/\s+app/i, '').trim();
    return {
      text: `Opening ${appName}.`,
      action: { type: 'open_app', input: { appName } },
    };
  }

  if (lower.includes('note') || lower.includes('remind')) {
    return {
      text: 'I can create a note or reminder for you. What would you like me to save?',
      action: { type: 'create_note', input: { content } },
    };
  }

  return {
    text: `I understand you said: "${content.slice(0, 100)}". I can help with searches, bank balances, weather, calls, notes, and app control. What would you like to do?`,
    memory: { ...memory, lastQuery: content },
  };
}

async function queueAction(
  userId: string,
  conversationId: string,
  sessionId: string,
  action: { type: ActionType; input: Record<string, unknown> },
  actorId: string
) {
  const requiresConfirmation = ['transfer_money', 'call_contact', 'send_message'].includes(action.type);
  const doc = await AssistantAction.create({
    actionId: actId(),
    userId: new Types.ObjectId(userId),
    conversationId,
    sessionId,
    actionType: action.type,
    status: requiresConfirmation ? 'pending' : 'executing',
    input: action.input,
    requiresConfirmation,
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'assistant:action', {
    actionId: doc.actionId,
    type: action.type,
    status: doc.status,
    requiresConfirmation,
  });

  if (!requiresConfirmation) {
    await executeAction(userId, doc.actionId, actorId);
  }
}

export async function confirmAction(userId: string, actionId: string, actorId: string) {
  await assertAssistant(userId);
  const action = await AssistantAction.findOne({ actionId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!action) throw new Error('ACTION_NOT_FOUND');
  if (action.status !== 'pending') throw new Error('ACTION_NOT_PENDING');
  action.status = 'executing';
  action.confirmedAt = new Date();
  await action.save();
  return executeAction(userId, actionId, actorId);
}

async function executeAction(userId: string, actionId: string, actorId: string) {
  const action = await AssistantAction.findOne({ actionId, userId: new Types.ObjectId(userId) });
  if (!action) throw new Error('ACTION_NOT_FOUND');

  try {
    let output: Record<string, unknown> = {};
    switch (action.actionType) {
      case 'open_app': {
        const appMap: Record<string, string> = {
          bank: 'com.gulfos.bank', phone: 'com.gulfos.phone', contacts: 'com.gulfos.contacts',
          messages: 'com.gulfos.messages', calendar: 'com.gulfos.calendar', weather: 'com.gulfos.weather',
          settings: 'com.gulfos.settings', maps: 'com.gulfos.maps',
        };
        const name = String(action.input.appName ?? '').toLowerCase();
        const bundleId = Object.entries(appMap).find(([k]) => name.includes(k))?.[1] ?? 'com.gulfos.settings';
        output = { bundleId, opened: true };
        break;
      }
      case 'call_contact': {
        const { initiateCall } = await import('./callEngineService');
        const result = await initiateCall(userId, { toNumber: String(action.input.number), contactName: String(action.input.number) }, actorId);
        output = result as Record<string, unknown>;
        break;
      }
      case 'create_note': {
        const { createNote } = await import('./notesService');
        const note = await createNote(userId, { title: 'Assistant Note', content: String(action.input.content ?? '') }, actorId);
        output = { noteId: note.noteId };
        break;
      }
      default:
        output = { executed: true, type: action.actionType };
    }
    action.status = 'completed';
    action.output = output;
    action.completedAt = new Date();
    await action.save();
    emitToUser(userId, 'assistant:completed', { actionId, output });
    return { actionId, status: 'completed', output };
  } catch (err) {
    action.status = 'failed';
    action.errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await action.save();
    throw err;
  }
}

export async function getConversationMessages(userId: string, conversationId: string) {
  await assertAssistant(userId);
  const session = await AssistantSession.findOne({ userId: new Types.ObjectId(userId), conversationId, deletedAt: null });
  if (!session) throw new Error('SESSION_NOT_FOUND');
  return session.messages.map((m) => ({
    messageId: m.messageId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export async function deleteConversation(userId: string, conversationId: string, actorId: string) {
  await assertAssistant(userId);
  await AssistantConversation.findOneAndUpdate(
    { conversationId, userId: new Types.ObjectId(userId) },
    { deletedAt: new Date() }
  );
  await AssistantSession.updateMany({ conversationId, userId: new Types.ObjectId(userId) }, { deletedAt: new Date() });
  await logAudit({ userId, actorId, action: 'assistant_conversation_delete', resource: 'assistant', resourceId: conversationId });
  return { deleted: true };
}

export { ASSISTANT_APP_BUNDLE };
