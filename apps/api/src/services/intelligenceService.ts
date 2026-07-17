import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import {
  Prediction, Suggestion, SearchIndexEntry, SearchHistory, Dashboard, VoiceSession,
} from '../database/models/Intelligence';
import { INTELLIGENCE_APP_BUNDLE, type PredictionType, type DashboardType } from '../constants/intelligence';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { globalSearch } from './globalSearchService';
import { InstalledPackage } from '../database/models/InstalledPackage';

function predId() { return `PRD-${uuidv4().slice(0, 8).toUpperCase()}`; }
function sugId() { return `SUG-${uuidv4().slice(0, 8).toUpperCase()}`; }
function idxId() { return `IDX-${uuidv4().slice(0, 8).toUpperCase()}`; }
function dashId() { return `DSH-${uuidv4().slice(0, 8).toUpperCase()}`; }
function voiceId() { return `VCE-${uuidv4().slice(0, 8).toUpperCase()}`; }

async function assertIntelligence(userId: string) {
  const allowed = await checkPermission(userId, INTELLIGENCE_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('INTELLIGENCE_PERMISSION_DENIED');
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export async function generatePredictions(userId: string) {
  await assertIntelligence(userId);
  const oid = new Types.ObjectId(userId);
  await Prediction.deleteMany({ userId: oid, expiresAt: { $lt: new Date() } });

  const predictions: { type: PredictionType; targetId: string; targetLabel: string; confidence: number; metadata?: Record<string, unknown> }[] = [];

  const appsForPred = await InstalledPackage.find({ userId: oid }).limit(5).lean();
  for (const [i, app] of appsForPred.entries()) {
    const bundleId = app.bundleId;
    predictions.push({
      type: 'app_usage', targetId: bundleId, targetLabel: bundleId,
      confidence: Math.max(0.5, 1 - i * 0.1), metadata: { rank: i + 1 },
    });
  }

  try {
    const { Contact } = await import('../database/models/Contact');
    const contacts = await Contact.find({ userId: oid, favorite: true, deletedAt: null }).limit(3).lean();
    for (const c of contacts) {
      predictions.push({ type: 'contact', targetId: c.contactId, targetLabel: c.displayName, confidence: 0.75 });
    }
  } catch { /* optional */ }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const created = [];
  for (const p of predictions) {
    const doc = await Prediction.findOneAndUpdate(
      { userId: oid, type: p.type, targetId: p.targetId },
      { predictionId: predId(), userId: oid, ...p, expiresAt },
      { upsert: true, new: true }
    );
    created.push(doc);
  }
  emitToUser(userId, 'prediction:generated', { count: created.length });
  return created.map((p) => ({
    predictionId: p.predictionId, type: p.type, targetId: p.targetId,
    targetLabel: p.targetLabel, confidence: p.confidence,
  }));
}

export async function getPredictions(userId: string, type?: PredictionType) {
  await assertIntelligence(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (type) filter.type = type;
  const preds = await Prediction.find(filter).sort({ confidence: -1 }).limit(20);
  return preds.map((p) => ({
    predictionId: p.predictionId, type: p.type, targetId: p.targetId,
    targetLabel: p.targetLabel, confidence: p.confidence, metadata: p.metadata,
  }));
}

// ─── Suggestions ───────────────────────────────────────────────────────────

export async function generateSuggestions(userId: string) {
  await assertIntelligence(userId);
  const oid = new Types.ObjectId(userId);
  await Suggestion.updateMany({ userId: oid, dismissed: false }, { dismissed: true });

  const suggestions = [];
  const preds = await getPredictions(userId, 'app_usage');
  for (const p of preds.slice(0, 3)) {
    const doc = await Suggestion.create({
      suggestionId: sugId(), userId: oid, type: 'app',
      title: `Open ${p.targetLabel}`, subtitle: 'Frequently used',
      actionType: 'open_app', actionPayload: { appId: p.targetId },
      confidence: p.confidence,
    });
    suggestions.push(doc);
  }

  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) {
    suggestions.push(await Suggestion.create({
      suggestionId: sugId(), userId: oid, type: 'action',
      title: 'Check weather', subtitle: 'Good morning routine',
      actionType: 'open_app', actionPayload: { appId: 'com.gulfos.weather' },
      confidence: 0.8,
    }));
  }

  emitToUser(userId, 'suggestion:generated', { count: suggestions.length });
  return suggestions.map((s) => ({
    suggestionId: s.suggestionId, type: s.type, title: s.title,
    subtitle: s.subtitle, actionType: s.actionType, confidence: s.confidence,
  }));
}

export async function getSuggestions(userId: string) {
  await assertIntelligence(userId);
  const sugs = await Suggestion.find({ userId: new Types.ObjectId(userId), dismissed: false })
    .sort({ confidence: -1 }).limit(10);
  return sugs.map((s) => ({
    suggestionId: s.suggestionId, type: s.type, title: s.title,
    subtitle: s.subtitle, actionType: s.actionType, actionPayload: s.actionPayload, confidence: s.confidence,
  }));
}

export async function dismissSuggestion(userId: string, suggestionId: string) {
  await Suggestion.findOneAndUpdate(
    { suggestionId, userId: new Types.ObjectId(userId) },
    { dismissed: true }
  );
  return { dismissed: true };
}

// ─── Search Index 2.0 ────────────────────────────────────────────────────────

export async function refreshSearchIndex(userId: string) {
  await assertIntelligence(userId);
  const oid = new Types.ObjectId(userId);
  let indexed = 0;

  const apps = await InstalledPackage.find({ userId: oid }).lean();
  for (const app of apps) {
    const bundleId = app.bundleId;
    await SearchIndexEntry.findOneAndUpdate(
      { userId: oid, type: 'app', sourceId: bundleId },
      {
        entryId: idxId(), userId: oid, type: 'app', sourceId: bundleId,
        title: bundleId, route: bundleId,
        keywords: [bundleId],
        indexedAt: new Date(),
      },
      { upsert: true }
    );
    indexed++;
  }

  const categories = ['contacts', 'calls', 'messages', 'notes', 'calendar', 'bank_accounts', 'identity'] as const;
  for (const cat of categories) {
    try {
      const results = await globalSearch(userId, 'a', [cat]);
      for (const r of results.results.slice(0, 20)) {
        await SearchIndexEntry.findOneAndUpdate(
          { userId: oid, type: r.category as never, sourceId: r.id },
          {
            entryId: idxId(), userId: oid, type: r.category as never, sourceId: r.id,
            title: r.title, subtitle: r.subtitle, route: r.route,
            keywords: [r.title, r.subtitle ?? ''].filter(Boolean),
            indexedAt: new Date(),
          },
          { upsert: true }
        );
        indexed++;
      }
    } catch { /* category optional */ }
  }

  emitToUser(userId, 'search:index:update', { indexed });
  return { indexed };
}

export async function searchIndex(userId: string, query: string, limit = 30) {
  await assertIntelligence(userId);
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const results = await SearchIndexEntry.find({
    userId: new Types.ObjectId(userId),
    $or: [{ title: regex }, { subtitle: regex }, { keywords: regex }],
  }).limit(limit);

  if (query.trim()) {
    await SearchHistory.create({
      historyId: `SH-${uuidv4().slice(0, 8)}`,
      userId: new Types.ObjectId(userId),
      query: query.trim(),
      resultCount: results.length,
    });
  }

  return results.map((e) => ({
    entryId: e.entryId, type: e.type, sourceId: e.sourceId,
    title: e.title, subtitle: e.subtitle, route: e.route,
  }));
}

export async function getSearchHistory(userId: string, limit = 20) {
  const history = await SearchHistory.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 }).limit(limit);
  return history.map((h) => ({ query: h.query, resultCount: h.resultCount, createdAt: h.createdAt }));
}

// ─── Dashboards ────────────────────────────────────────────────────────────

export async function initializeDashboards(userId: string, actorId: string) {
  await assertIntelligence(userId);
  const oid = new Types.ObjectId(userId);
  const types: DashboardType[] = ['personal', 'bank', 'business', 'exchange', 'weather'];
  for (const type of types) {
    const exists = await Dashboard.findOne({ userId: oid, type, deletedAt: null });
    if (!exists) {
      await Dashboard.create({
        dashboardId: dashId(), userId: oid, type,
        name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Dashboard`,
        isDefault: type === 'personal',
        widgets: getDefaultWidgets(type),
        createdBy: new Types.ObjectId(actorId),
      });
    }
  }
  return { initialized: true };
}

function getDefaultWidgets(type: DashboardType) {
  const widgets: { widgetId: string; type: string; config: Record<string, unknown>; position: number }[] = [];
  if (type === 'personal') {
    widgets.push({ widgetId: 'w1', type: 'calendar', config: {}, position: 0 });
    widgets.push({ widgetId: 'w2', type: 'weather', config: {}, position: 1 });
  }
  if (type === 'bank') widgets.push({ widgetId: 'w1', type: 'bank', config: {}, position: 0 });
  if (type === 'business') widgets.push({ widgetId: 'w1', type: 'business', config: {}, position: 0 });
  if (type === 'exchange') widgets.push({ widgetId: 'w1', type: 'exchange', config: {}, position: 0 });
  if (type === 'weather') widgets.push({ widgetId: 'w1', type: 'weather', config: {}, position: 0 });
  return widgets;
}

export async function getDashboards(userId: string) {
  await assertIntelligence(userId);
  const dashboards = await Dashboard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return dashboards.map((d) => ({
    dashboardId: d.dashboardId, type: d.type, name: d.name,
    widgets: d.widgets, isDefault: d.isDefault, lastRefreshedAt: d.lastRefreshedAt,
  }));
}

export async function refreshDashboard(userId: string, dashboardId: string) {
  await assertIntelligence(userId);
  const dash = await Dashboard.findOne({ dashboardId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!dash) throw new Error('DASHBOARD_NOT_FOUND');

  const snapshot: Record<string, unknown> = { refreshedAt: new Date().toISOString() };
  const { getBatchWidgetData } = await import('./widgetEngineService');
  const widgetData = await getBatchWidgetData(userId, dash.widgets.map((w) => ({ type: w.type, config: w.config })));
  snapshot.widgets = widgetData;

  if (dash.type === 'bank') {
    try {
      const { getDashboard: getBankDash } = await import('./bankService');
      snapshot.bank = await getBankDash(userId);
    } catch { /* optional */ }
  }
  if (dash.type === 'business') {
    try {
      const { Company } = await import('../database/models/Company');
      const companies = await Company.find({ deletedAt: null }).limit(5).lean();
      snapshot.companies = companies.length;
    } catch { /* optional */ }
  }

  dash.snapshot = snapshot;
  dash.lastRefreshedAt = new Date();
  await dash.save();
  emitToUser(userId, 'dashboard:update', { dashboardId, type: dash.type });
  return { dashboardId, snapshot };
}

// ─── Voice Engine ──────────────────────────────────────────────────────────

export async function startVoiceSession(userId: string, language = 'en') {
  await assertIntelligence(userId);
  const session = await VoiceSession.create({
    sessionId: voiceId(),
    userId: new Types.ObjectId(userId),
    status: 'listening',
    language,
    startedAt: new Date(),
  });
  emitToUser(userId, 'assistant:voice', { sessionId: session.sessionId, status: 'listening' });
  return { sessionId: session.sessionId, status: 'listening' };
}

export async function processVoiceCommand(userId: string, sessionId: string, transcript: string) {
  await assertIntelligence(userId);
  const session = await VoiceSession.findOne({ sessionId, userId: new Types.ObjectId(userId) });
  if (!session) throw new Error('VOICE_SESSION_NOT_FOUND');

  session.transcript.push(transcript);
  session.status = 'processing';
  await session.save();

  const { createConversation, sendMessage } = await import('./assistantService');
  const conv = await createConversation(userId, 'Voice', userId);
  const result = await sendMessage(userId, conv.conversationId, transcript, userId);

  session.commands.push({ command: transcript, executedAt: new Date(), success: true });
  session.status = 'speaking';
  await session.save();

  emitToUser(userId, 'assistant:voice', { sessionId, status: 'speaking', response: result });
  return { sessionId, transcript, response: result };
}

export async function endVoiceSession(userId: string, sessionId: string) {
  const session = await VoiceSession.findOne({ sessionId, userId: new Types.ObjectId(userId) });
  if (session) {
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();
  }
  emitToUser(userId, 'assistant:voice', { sessionId, status: 'ended' });
  return { ended: true };
}

// ─── Background Intelligence ─────────────────────────────────────────────────

export async function runBackgroundOptimization(userId: string) {
  const predictions = await generatePredictions(userId);
  const suggestions = await generateSuggestions(userId);
  await refreshSearchIndex(userId);
  return { predictions: predictions.length, suggestions: suggestions.length };
}

export async function initializeIntelligence(userId: string, actorId: string) {
  await assertIntelligence(userId);
  await initializeDashboards(userId, actorId);
  await generatePredictions(userId);
  await generateSuggestions(userId);
  return { initialized: true };
}

export { INTELLIGENCE_APP_BUNDLE };
