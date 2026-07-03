"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { dispatchIncidents } from "@/lib/data/mock";
import type { DispatchIncident } from "@/types";
import { cn } from "@/lib/utils/cn";
import { UnitsChannels } from "./UnitsChannels";
import { RecentIncidents } from "./RecentIncidents";

const priorityVariant = {
  high: "red" as const,
  medium: "amber" as const,
  low: "blue" as const,
};

export function DispatchBoard() {
  const [selected, setSelected] = useState<DispatchIncident>(dispatchIncidents[0]);

  return (
    <div className="page-enter space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-mdt-foreground">
          {messages.dispatch.title}
        </h1>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <UnitsChannels />
        </div>
        <div className="xl:col-span-6">
          <Panel title={messages.dispatch.mapTitle} className="h-full min-h-[480px]">
            <div className="relative h-[420px] overflow-hidden rounded-md border border-mdt-panel-border bg-slate-950">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-transparent to-slate-950/90" />

              {dispatchIncidents.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelected(inc)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                  style={{ left: `${inc.mapX}%`, top: `${inc.mapY}%` }}
                  aria-label={inc.location}
                >
                  {selected.id === inc.id && (
                    <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-neon-red/30" />
                  )}
                  <span
                    className={cn(
                      "relative flex h-7 w-7 items-center justify-center rounded-full border-2 bg-slate-900/80",
                      selected.id === inc.id
                        ? "border-neon-red mdt-glow-red"
                        : inc.status === "closed"
                          ? "border-mdt-muted opacity-50"
                          : "border-neon-blue/60",
                    )}
                  >
                    <MapPin
                      className={cn(
                        "h-3.5 w-3.5",
                        selected.id === inc.id ? "text-neon-red" : "text-neon-blue",
                      )}
                    />
                  </span>
                </button>
              ))}

              <div className="absolute bottom-3 start-3 end-3 rounded-lg border border-mdt-panel-border bg-slate-900/95 p-3 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-bold text-neon-blue">{selected.callNumber}</p>
                  <StatusBadge
                    label={messages.dispatch.priorities[selected.priority]}
                    variant={priorityVariant[selected.priority]}
                  />
                  <StatusBadge
                    label={messages.dispatch.statuses[selected.status]}
                    variant={selected.status === "active" ? "red" : "blue"}
                  />
                </div>
                <p className="mt-1 text-sm font-medium">{selected.location}</p>
                <p className="mt-1 text-xs text-mdt-muted">{selected.description}</p>
              </div>
            </div>
          </Panel>
        </div>
        <div className="xl:col-span-3">
          <RecentIncidents selectedId={selected.id} onSelect={setSelected} />
        </div>
      </div>
    </div>
  );
}
