"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "system" | "warrant" | "dispatch" | "doj";
}

interface NotificationContextValue {
  toasts: Toast[];
  notifications: AppNotification[];
  unreadCount: number;
  toast: (opts: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "مذكرة توقيف جديدة",
    body: "Marcus Webb — Grove St",
    time: new Date().toISOString(),
    read: false,
    type: "warrant",
  },
  {
    id: "n2",
    title: "بلاغ نشط",
    body: "Legion Square — إطلاق نار",
    time: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: "dispatch",
  },
  {
    id: "n3",
    title: "طلب DOJ",
    body: "ملف Elena Voss جاهز للمراجعة",
    time: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    type: "doj",
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      toasts,
      notifications,
      unreadCount,
      toast,
      dismissToast,
      markRead,
      markAllRead,
    }),
    [toasts, notifications, unreadCount, toast, dismissToast, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
