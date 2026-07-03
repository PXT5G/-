"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (id: string, href?: string) => {
    markRead(id);
    if (href) {
      router.push(href);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg border border-mdt-panel-border transition-all hover:accent-border hover:accent-bg",
          open && "accent-border accent-bg",
        )}
        aria-label={messages.notifications.title}
      >
        <Bell className="h-4 w-4 text-mdt-muted" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-red px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown-enter absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-mdt-panel-border bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-mdt-panel-border px-4 py-3">
            <span className="text-sm font-bold">{messages.notifications.title}</span>
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-[10px] accent-text hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              {messages.notifications.markAllRead}
            </button>
          </div>
          <ul className="mdt-scroll max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n.id, n.href)}
                  className={cn(
                    "w-full border-b border-mdt-panel-border/50 px-4 py-3 text-start transition-colors hover:bg-slate-800/50",
                    !n.read && "accent-bg",
                  )}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-mdt-muted">{n.body}</p>
                  <time className="mt-1 block text-[10px] text-mdt-muted">
                    {new Date(n.time).toLocaleString("ar-SA")}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
