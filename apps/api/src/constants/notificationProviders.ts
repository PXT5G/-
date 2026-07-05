/** Notification delivery provider types — Integration Foundation V1 */

export const NOTIFICATION_PROVIDER_CHANNELS = [
  'socket',
  'event_bus',
] as const;

export type NotificationProviderChannel = (typeof NOTIFICATION_PROVIDER_CHANNELS)[number];

export interface NotificationDeliveryContext {
  userId: string;
  appId: string;
  notificationId: string;
  queueId: string;
  title: string;
  body: string;
  priority: string;
  payload: Record<string, unknown>;
}

export interface NotificationProvider {
  readonly id: string;
  readonly channel: NotificationProviderChannel | string;
  isEnabled(): boolean;
  deliver(context: NotificationDeliveryContext): Promise<void>;
}
