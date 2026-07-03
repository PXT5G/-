"use client";

import { Phone, User } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { dispatchIncidents } from "@/lib/data/mock";
import type { DispatchIncident } from "@/types";
import { cn } from "@/lib/utils/cn";

interface RecentIncidentsProps {
  selectedId?: string;
  onSelect?: (inc: DispatchIncident) => void;
}

const priorityVariant = {
  high: "red" as const,
  medium: "amber" as const,
  low: "blue" as const,
};

export function RecentIncidents({ selectedId, onSelect }: RecentIncidentsProps) {
  return (
    <Panel title={messages.dispatch.recentIncidents} className="h-full">
      <ul className="mdt-scroll max-h-[520px] space-y-3 overflow-y-auto pe-1">
        {dispatchIncidents.map((inc) => (
          <li key={inc.id}>
            <button
              type="button"
              onClick={() => onSelect?.(inc)}
              className={cn(
                "w-full rounded-md border bg-slate-900/50 p-3 text-start transition-all card-hover",
                selectedId === inc.id
                  ? "border-neon-blue/50 bg-neon-blue/5 mdt-glow-blue"
                  : "border-mdt-panel-border hover:border-neon-blue/30",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-neon-blue">
                  {messages.dispatch.callNumber} {inc.callNumber}
                </span>
                <time className="text-[10px] text-mdt-muted">{inc.time}</time>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                <StatusBadge
                  label={messages.dispatch.priorities[inc.priority]}
                  variant={priorityVariant[inc.priority]}
                />
                <StatusBadge
                  label={messages.dispatch.statuses[inc.status]}
                  variant={inc.status === "active" ? "red" : "blue"}
                />
              </div>
              <p className="text-sm font-medium text-mdt-foreground">{inc.location}</p>
              <p className="mt-2 text-xs leading-relaxed text-mdt-muted">{inc.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 border-t border-mdt-panel-border pt-2 text-xs text-mdt-muted">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" aria-hidden />
                  {messages.dispatch.callerName}: {inc.callerName}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {messages.dispatch.phone}: {inc.callerPhone}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
