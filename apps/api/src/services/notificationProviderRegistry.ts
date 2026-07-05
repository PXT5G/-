import type { NotificationProvider } from '../constants/notificationProviders';

const providers = new Map<string, NotificationProvider>();

export function registerNotificationProvider(provider: NotificationProvider): void {
  providers.set(provider.id, provider);
}

export function unregisterNotificationProvider(providerId: string): void {
  providers.delete(providerId);
}

export function listNotificationProviders(): { id: string; channel: string; enabled: boolean }[] {
  return Array.from(providers.values()).map((p) => ({
    id: p.id,
    channel: p.channel,
    enabled: p.isEnabled(),
  }));
}

export async function dispatchToNotificationProviders(
  context: Parameters<NotificationProvider['deliver']>[0]
): Promise<{ delivered: string[]; failed: string[] }> {
  const delivered: string[] = [];
  const failed: string[] = [];

  for (const provider of providers.values()) {
    if (!provider.isEnabled()) continue;
    try {
      await provider.deliver(context);
      delivered.push(provider.id);
    } catch (err) {
      failed.push(provider.id);
      console.error(`[NotificationProvider:${provider.id}]`, err);
    }
  }

  return { delivered, failed };
}

export function clearNotificationProviders(): void {
  providers.clear();
}
