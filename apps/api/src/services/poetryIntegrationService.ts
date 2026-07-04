import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { PoetryModerationLog } from '../database/models/PoetryModerationLog';
import { POETRY_APP_BUNDLE } from '../constants/poetry';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { checkPermission } from './permissionBrokerService';

export async function logPoetryAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: { ...params.metadata, deviceUuid: params.deviceUuid },
    ipAddress: params.ipAddress,
  });
}

export async function logModerationAction(params: {
  poemId: string;
  actorId: string;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
}) {
  const logId = `MOD-${Date.now().toString(36).toUpperCase()}`;
  await PoetryModerationLog.create({
    logId,
    poemId: params.poemId,
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    reason: params.reason,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
  });
  await logPoetryAction({
    userId: params.actorId,
    actorId: params.actorId,
    action: `poetry_moderation_${params.action}`,
    resource: 'poetry_moderation',
    resourceId: params.poemId,
    metadata: { reason: params.reason, ...params.metadata },
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
  });
}

export async function getIdentityUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  const hasIdentity = await checkPermission(userId, 'com.gulfos.identity', 'storage');
  return {
    userId: user._id.toString(),
    displayName: user.displayName,
    username: user.username,
    avatar: user.avatar,
    email: user.email,
    hasIdentity,
  };
}

export async function sendPoetryNotification(params: {
  userId: string;
  title: string;
  body: string;
  deepLink?: string;
  priority?: 'low' | 'normal' | 'high';
}) {
  await enqueueNotification({
    userId: params.userId,
    appId: POETRY_APP_BUNDLE,
    title: params.title,
    body: params.body,
    priority: params.priority ?? 'normal',
    deepLink: params.deepLink ?? 'gulfos://poetry',
  });
}

export function buildPdfExport(poem: {
  title: string;
  content: string;
  markdown: string;
  authorName: string;
  category: string;
  publishedAt?: Date;
}) {
  const date = poem.publishedAt ? poem.publishedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const body = poem.markdown || poem.content;
  return {
    filename: `${poem.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}.pdf`,
    mimeType: 'application/pdf',
    content: [
      'GULF Poetry — Official Export',
      '================================',
      `Title: ${poem.title}`,
      `Author: ${poem.authorName}`,
      `Category: ${poem.category}`,
      `Date: ${date}`,
      '',
      body,
      '',
      '— Exported from GULF Poetry (com.gulfos.poetry)',
    ].join('\n'),
  };
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 150));
}

export function buildExcerpt(text: string, maxLen = 160): string {
  const plain = text.replace(/[#*_`>\[\]]/g, '').trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen - 1)}…`;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'poem';
}
