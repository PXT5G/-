import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { CalendarEvent } from '../database/models/CalendarEvent';
import { SYSTEM_APP_BUNDLES, type CalendarEventType } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { enqueueNotification } from './notificationBrokerService';
import { emitToUser } from './socketService';

function formatEvent(e: InstanceType<typeof CalendarEvent>) {
  return {
    eventId: e.eventId,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    allDay: e.allDay,
    location: e.location,
    recurrence: e.recurrence,
    reminderMinutes: e.reminderMinutes,
    invitedUserIds: e.invitedUserIds,
    metadata: e.metadata,
  };
}

export async function listEvents(userId: string, from?: Date, to?: Date) {
  const query: Record<string, unknown> = { userId, deletedAt: null };
  if (from || to) {
    query.startAt = {};
    if (from) (query.startAt as Record<string, Date>).$gte = from;
    if (to) (query.startAt as Record<string, Date>).$lte = to;
  }
  const events = await CalendarEvent.find(query).sort({ startAt: 1 }).limit(100);
  return events.map(formatEvent);
}

export async function createEvent(
  userId: string,
  params: {
    title: string;
    description?: string;
    eventType?: CalendarEventType;
    startAt: string;
    endAt: string;
    allDay?: boolean;
    location?: string;
    recurrence?: string;
    reminderMinutes?: number[];
    invitedUserIds?: string[];
    metadata?: Record<string, unknown>;
  },
  actorId: string
) {
  const eventId = uuidv4();
  const event = await CalendarEvent.create({
    userId: new Types.ObjectId(userId),
    eventId,
    title: params.title,
    description: params.description,
    eventType: params.eventType ?? 'event',
    startAt: new Date(params.startAt),
    endAt: new Date(params.endAt),
    allDay: params.allDay ?? false,
    location: params.location,
    recurrence: params.recurrence ?? 'none',
    reminderMinutes: params.reminderMinutes ?? [15],
    invitedUserIds: params.invitedUserIds ?? [],
    metadata: params.metadata ?? {},
    createdBy: new Types.ObjectId(actorId),
  });

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.calendar, action: 'event_create', resourceId: eventId });
  emitToUser(userId, 'calendar:update', { action: 'event_created', eventId });

  if (params.reminderMinutes?.length) {
    await enqueueNotification({
      userId,
      appId: SYSTEM_APP_BUNDLES.calendar,
      title: params.title,
      body: `Reminder: ${params.title}`,
      priority: 'normal',
      scheduledAt: new Date(new Date(params.startAt).getTime() - (params.reminderMinutes[0] ?? 15) * 60_000),
    });
  }

  return formatEvent(event);
}

export async function seedGovernmentEvents(userId: string, actorId: string) {
  const now = new Date();
  const samples = [
    { title: 'City Council Meeting', eventType: 'government' as const, days: 3 },
    { title: 'Police Shift — Night Patrol', eventType: 'police_shift' as const, days: 1 },
    { title: 'Court Hearing — Case #4521', eventType: 'justice_hearing' as const, days: 5 },
    { title: 'Mortgage Payment Due', eventType: 'bank_payment' as const, days: 7 },
  ];
  for (const s of samples) {
    const start = new Date(now.getTime() + s.days * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    await createEvent(userId, {
      title: s.title,
      eventType: s.eventType,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }, actorId);
  }
  return listEvents(userId);
}

export async function deleteEvent(userId: string, eventId: string, actorId: string) {
  const event = await CalendarEvent.findOneAndUpdate(
    { userId, eventId },
    { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
    { new: true }
  );
  if (!event) throw new Error('EVENT_NOT_FOUND');
  emitToUser(userId, 'calendar:update', { action: 'event_deleted', eventId });
  return { deleted: true };
}
