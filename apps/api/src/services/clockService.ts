import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { ClockAlarm } from '../database/models/ClockAlarm';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { enqueueNotification } from './notificationBrokerService';
import { emitToUser } from './socketService';

function formatAlarm(a: InstanceType<typeof ClockAlarm>) {
  return {
    alarmId: a.alarmId,
    label: a.label,
    hour: a.hour,
    minute: a.minute,
    enabled: a.enabled,
    repeatDays: a.repeatDays,
    sound: a.sound,
    snoozeMinutes: a.snoozeMinutes,
    sleepScheduleStart: a.sleepScheduleStart,
    sleepScheduleEnd: a.sleepScheduleEnd,
  };
}

export async function listAlarms(userId: string) {
  const alarms = await ClockAlarm.find({ userId, deletedAt: null }).sort({ hour: 1, minute: 1 });
  return alarms.map(formatAlarm);
}

export async function createAlarm(
  userId: string,
  params: { label?: string; hour: number; minute: number; repeatDays?: number[]; sound?: string },
  actorId: string
) {
  const alarmId = uuidv4();
  const alarm = await ClockAlarm.create({
    userId: new Types.ObjectId(userId),
    alarmId,
    label: params.label ?? 'Alarm',
    hour: params.hour,
    minute: params.minute,
    repeatDays: params.repeatDays ?? [],
    sound: params.sound ?? 'radar',
    createdBy: new Types.ObjectId(actorId),
  });

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.clock, action: 'alarm_create', resourceId: alarmId });
  emitToUser(userId, 'clock:update', { action: 'alarm_created', alarmId });
  return formatAlarm(alarm);
}

export async function toggleAlarm(userId: string, alarmId: string, actorId: string) {
  const alarm = await ClockAlarm.findOne({ userId, alarmId, deletedAt: null });
  if (!alarm) throw new Error('ALARM_NOT_FOUND');
  alarm.enabled = !alarm.enabled;
  alarm.updatedBy = new Types.ObjectId(actorId);
  await alarm.save();
  emitToUser(userId, 'clock:update', { action: 'alarm_toggled', alarmId, enabled: alarm.enabled });
  return formatAlarm(alarm);
}

export async function setSleepSchedule(
  userId: string,
  params: { start: string; end: string },
  actorId: string
) {
  let alarm = await ClockAlarm.findOne({ userId, label: 'Sleep Schedule', deletedAt: null });
  if (!alarm) {
    alarm = await ClockAlarm.create({
      userId: new Types.ObjectId(userId),
      alarmId: uuidv4(),
      label: 'Sleep Schedule',
      hour: parseInt(params.start.split(':')[0] ?? '22', 10),
      minute: parseInt(params.start.split(':')[1] ?? '0', 10),
      enabled: true,
      sleepScheduleStart: params.start,
      sleepScheduleEnd: params.end,
      createdBy: new Types.ObjectId(actorId),
    });
  } else {
    alarm.sleepScheduleStart = params.start;
    alarm.sleepScheduleEnd = params.end;
    await alarm.save();
  }
  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.clock, action: 'sleep_schedule', metadata: params });
  return formatAlarm(alarm);
}

export async function getWorldClocks() {
  return [
    { city: 'Los Santos', timezone: 'America/Los_Angeles', offset: -7 },
    { city: 'London', timezone: 'Europe/London', offset: 0 },
    { city: 'Tokyo', timezone: 'Asia/Tokyo', offset: 9 },
    { city: 'Sydney', timezone: 'Australia/Sydney', offset: 11 },
    { city: 'New York', timezone: 'America/New_York', offset: -5 },
  ];
}

export async function scheduleAlarmNotifications(userId: string): Promise<number> {
  const alarms = await ClockAlarm.find({ userId, enabled: true, deletedAt: null });
  for (const a of alarms) {
    const now = new Date();
    const trigger = new Date(now);
    trigger.setHours(a.hour, a.minute, 0, 0);
    if (trigger <= now) trigger.setDate(trigger.getDate() + 1);
    await enqueueNotification({
      userId,
      appId: SYSTEM_APP_BUNDLES.clock,
      title: a.label,
      body: 'Alarm',
      priority: 'high',
      scheduledAt: trigger,
    });
  }
  return alarms.length;
}
