"use client";

import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useNotifications, type ToastVariant } from "@/context/NotificationContext";
import { cn } from "@/lib/utils/cn";

const icons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastVariant, string> = {
  success: "border-neon-green/40 bg-neon-green/10 text-neon-green",
  error: "border-neon-red/40 bg-neon-red/10 text-neon-red",
  info: "border-neon-blue/40 bg-neon-blue/10 text-neon-blue",
  warning: "border-amber-400/40 bg-amber-400/10 text-amber-300",
};

export function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="pointer-events-none fixed bottom-6 start-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "toast-enter pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md",
              styles[t.variant],
            )}
            role="status"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-mdt-foreground">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-xs text-mdt-muted">{t.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
