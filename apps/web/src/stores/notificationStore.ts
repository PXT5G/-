import { create } from 'zustand';
import type { OSNotification } from '@/types';

interface NotificationState {
  notifications: OSNotification[];
  isCenterOpen: boolean;
  unreadCount: number;
  addNotification: (notification: OSNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setCenterOpen: (open: boolean) => void;
  setNotifications: (notifications: OSNotification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isCenterOpen: false,
  unreadCount: 0,

  addNotification: (notification) =>
    set((s) => {
      const notifications = [notification, ...s.notifications].slice(0, 100);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAsRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setCenterOpen: (isCenterOpen) => set({ isCenterOpen }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
}));
