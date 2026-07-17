import {
  DISCORD_SENSITIVE_PATTERNS,
  type DiscordNotificationCategory,
} from '../../constants/discordNotifications';

const REDACTED = '[redacted]';

export function sanitizeForDiscord(text: string): string {
  let out = text;
  for (const pattern of DISCORD_SENSITIVE_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out.trim();
}

export function sanitizeNotificationContent(input: {
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): { title: string; body: string; payload: Record<string, unknown> } {
  const payload = { ...(input.payload ?? {}) };
  const sensitiveKeys = [
    'balance',
    'fullBalance',
    'accountNumber',
    'iban',
    'password',
    'otp',
    'verificationCode',
    'documentNumber',
    'nationalId',
    'ssn',
    'privateDocument',
    'investigationData',
  ];

  for (const key of sensitiveKeys) {
    if (key in payload) delete payload[key];
  }

  return {
    title: sanitizeForDiscord(input.title),
    body: sanitizeForDiscord(input.body),
    payload,
  };
}

export function isCategoryAllowedForPrivacy(category: DiscordNotificationCategory): boolean {
  return category !== 'suspicious_activity' || true;
}
