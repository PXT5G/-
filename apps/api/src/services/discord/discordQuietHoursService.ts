import type { IQuietHours } from '../../database/models/DiscordNotificationPreferences';

export function isWithinQuietHours(
  quietHours: IQuietHours,
  now: Date = new Date()
): boolean {
  if (!quietHours.enabled) return false;
  if (quietHours.muteAll) return true;

  const [startH, startM] = quietHours.startTime.split(':').map(Number);
  const [endH, endM] = quietHours.endTime.split(':').map(Number);
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start <= end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
}

export function shouldDeliverDuringQuietHours(
  quietHours: IQuietHours,
  priority: string,
  now?: Date
): boolean {
  if (!isWithinQuietHours(quietHours, now)) return true;
  if (priority === 'critical') return true;
  if (quietHours.muteAll) return false;
  if (quietHours.criticalOnly) return priority === 'critical';
  return false;
}
