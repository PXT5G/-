import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { MailAccount } from '../database/models/MailAccount';
import { MailMessage } from '../database/models/MailMessage';
import { MAIL_APP_BUNDLE, MAIL_SOCKET_EVENTS, type MailFolder } from '../constants/mail';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';

function accountId() {
  return `MAIL-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function messageId() {
  return `MSG-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function assertMail(userId: string) {
  const allowed = await checkPermission(userId, MAIL_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('MAIL_PERMISSION_DENIED');
}

export async function initializeMail(userId: string, actorId: string, email?: string) {
  const existing = await MailAccount.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (existing) return { accountId: existing.accountId, email: existing.email };

  const doc = await MailAccount.create({
    accountId: accountId(),
    userId: new Types.ObjectId(userId),
    email: email ?? `user-${userId.slice(-6)}@gulf.mail`,
    displayName: 'GULF Mail',
    provider: 'gulf',
    isDefault: true,
    createdBy: new Types.ObjectId(actorId),
  });

  await logAudit({ userId, actorId, action: 'mail_initialize', resource: 'mail_account', resourceId: doc.accountId });
  return { accountId: doc.accountId, email: doc.email };
}

export async function listAccounts(userId: string) {
  await assertMail(userId);
  const accounts = await MailAccount.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return accounts.map((a) => ({
    accountId: a.accountId,
    email: a.email,
    displayName: a.displayName,
    provider: a.provider,
    isDefault: a.isDefault,
    unreadCount: a.unreadCount,
  }));
}

export async function listMessages(
  userId: string,
  folder: MailFolder = 'inbox',
  options: { limit?: number; offset?: number; search?: string } = {}
) {
  await assertMail(userId);
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    folder,
    deletedAt: null,
  };
  if (options.search) {
    const regex = new RegExp(options.search, 'i');
    filter.$or = [{ subject: regex }, { from: regex }, { bodyText: regex }];
  }

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const [messages, total] = await Promise.all([
    MailMessage.find(filter).sort({ receivedAt: -1 }).skip(offset).limit(limit),
    MailMessage.countDocuments(filter),
  ]);

  return {
    messages: messages.map(formatMessage),
    total,
    limit,
    offset,
  };
}

function formatMessage(doc: InstanceType<typeof MailMessage>) {
  return {
    messageId: doc.messageId,
    accountId: doc.accountId,
    folder: doc.folder,
    from: doc.from,
    to: doc.to,
    cc: doc.cc,
    subject: doc.subject,
    bodyText: doc.bodyText,
    bodyHtml: doc.bodyHtml,
    isRead: doc.isRead,
    isStarred: doc.isStarred,
    isPriority: doc.isPriority,
    labels: doc.labels,
    attachments: doc.attachments,
    scheduledAt: doc.scheduledAt?.toISOString(),
    sentAt: doc.sentAt?.toISOString(),
    receivedAt: doc.receivedAt.toISOString(),
  };
}

export async function sendMail(
  userId: string,
  input: {
    accountId: string;
    to: string[];
    cc?: string[];
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    scheduledAt?: string;
  },
  actorId: string
) {
  await assertMail(userId);
  const id = messageId();
  const folder: MailFolder = input.scheduledAt ? 'drafts' : 'sent';
  const doc = await MailMessage.create({
    messageId: id,
    userId: new Types.ObjectId(userId),
    accountId: input.accountId,
    folder,
    from: (await MailAccount.findOne({ accountId: input.accountId }))?.email ?? 'noreply@gulf.mail',
    to: input.to,
    cc: input.cc ?? [],
    bcc: [],
    subject: input.subject,
    bodyText: input.bodyText,
    bodyHtml: input.bodyHtml,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    sentAt: input.scheduledAt ? undefined : new Date(),
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'mail:updated', { message: formatMessage(doc) });
  await logAudit({ userId, actorId, action: 'mail_send', resource: 'mail_message', resourceId: id });
  return formatMessage(doc);
}

export async function receiveMail(
  userId: string,
  input: { accountId: string; from: string; subject: string; bodyText: string; isPriority?: boolean },
  actorId: string
) {
  const id = messageId();
  const doc = await MailMessage.create({
    messageId: id,
    userId: new Types.ObjectId(userId),
    accountId: input.accountId,
    folder: 'inbox',
    from: input.from,
    to: [],
    cc: [],
    bcc: [],
    subject: input.subject,
    bodyText: input.bodyText,
    isPriority: input.isPriority ?? false,
    createdBy: new Types.ObjectId(actorId),
  });

  await MailAccount.updateOne({ accountId: input.accountId }, { $inc: { unreadCount: 1 } });

  emitToUser(userId, 'mail:new', { message: formatMessage(doc) });
  await enqueueNotification({
    userId,
    appId: MAIL_APP_BUNDLE,
    title: input.from,
    body: input.subject,
    priority: input.isPriority ? 'high' : 'normal',
    deepLink: `gulfos://mail/${id}`,
    actorId,
  });

  return formatMessage(doc);
}

export async function updateMessage(
  userId: string,
  messageIdParam: string,
  updates: { isRead?: boolean; isStarred?: boolean; folder?: MailFolder },
  actorId: string
) {
  await assertMail(userId);
  const doc = await MailMessage.findOne({ messageId: messageIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('MAIL_NOT_FOUND');
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  emitToUser(userId, 'mail:updated', { message: formatMessage(doc) });
  return formatMessage(doc);
}

export async function deleteMessage(userId: string, messageIdParam: string, actorId: string) {
  await assertMail(userId);
  const doc = await MailMessage.findOne({ messageId: messageIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('MAIL_NOT_FOUND');
  doc.folder = 'trash';
  doc.deletedAt = new Date();
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  return { deleted: true };
}

export async function searchMail(userId: string, query: string) {
  await assertMail(userId);
  const regex = new RegExp(query, 'i');
  const messages = await MailMessage.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ subject: regex }, { from: regex }, { bodyText: regex }],
  }).limit(30);
  return messages.map(formatMessage);
}

export { MAIL_SOCKET_EVENTS };
