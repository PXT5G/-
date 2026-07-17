import type { NotificationProvider, NotificationDeliveryContext } from '../../constants/notificationProviders';
import { registerNotificationProvider } from '../notificationProviderRegistry';
import { emitToUser } from '../socketService';
import { publishEvent } from '../eventBusService';
import { discordNotificationProvider } from '../discord/discordNotificationProvider';

export const socketNotificationProvider: NotificationProvider = {
  id: 'socket',
  channel: 'socket',
  isEnabled: () => true,
  async deliver(context: NotificationDeliveryContext) {
    emitToUser(context.userId, 'notification:new', context.payload);
  },
};

export const eventBusNotificationProvider: NotificationProvider = {
  id: 'event_bus',
  channel: 'event_bus',
  isEnabled: () => true,
  async deliver(context: NotificationDeliveryContext) {
    await publishEvent({
      userId: context.userId,
      namespace: 'system.notifications',
      event: 'notification:delivered',
      payload: context.payload,
      source: 'notificationBroker',
    });
  },
};

export function registerDefaultNotificationProviders(): void {
  registerNotificationProvider(socketNotificationProvider);
  registerNotificationProvider(eventBusNotificationProvider);
  registerNotificationProvider(discordNotificationProvider);
}
