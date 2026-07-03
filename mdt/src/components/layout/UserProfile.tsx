"use client";

import { messages } from "@/lib/i18n/messages";
import { useMdt } from "@/context/MdtContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserProfile() {
  const { user, dutyStatus, toggleDuty } = useMdt();
  const onDuty = dutyStatus === "on_duty";

  return (
    <div className="border-t border-mdt-panel-border p-3">
      <div className="mdt-panel rounded-lg p-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
              onDuty
                ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                : "border-neon-red/50 bg-neon-red/10 text-neon-red",
            )}
            aria-hidden
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mdt-foreground">{user.name}</p>
            <p className="truncate text-xs text-mdt-muted">
              {user.rank} · {user.department}
            </p>
            <div className="mt-2">
              <StatusBadge
                label={onDuty ? messages.profile.onDuty : messages.profile.offDuty}
                variant={onDuty ? "green" : "red"}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleDuty}
          className={cn(
            "mt-3 w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
            onDuty
              ? "border-neon-red/40 text-neon-red hover:bg-neon-red/10"
              : "border-neon-green/40 text-neon-green hover:bg-neon-green/10",
          )}
          aria-label={messages.profile.toggleDuty}
        >
          {onDuty ? messages.profile.offDuty : messages.profile.onDuty}
        </button>
      </div>
    </div>
  );
}
