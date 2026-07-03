"use client";

import Link from "next/link";
import { Siren } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { dispatchIncidents } from "@/lib/data/mock";

const priorityVariant = {
  high: "red" as const,
  medium: "amber" as const,
  low: "blue" as const,
};

export function IncidentsBoard() {
  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon-red/40 bg-neon-red/10">
          <Siren className="h-6 w-6 text-neon-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{messages.incidents.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.incidents.subtitle}</p>
        </div>
      </header>

      <div className="stagger-children grid gap-3">
        {dispatchIncidents.map((inc) => (
          <Panel key={inc.id} className="card-hover">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-neon-blue">{inc.callNumber}</span>
                  <StatusBadge
                    label={messages.dispatch.priorities[inc.priority]}
                    variant={priorityVariant[inc.priority]}
                  />
                  <StatusBadge
                    label={messages.dispatch.statuses[inc.status]}
                    variant={inc.status === "active" ? "red" : "blue"}
                  />
                  <time className="text-xs text-mdt-muted">{inc.time}</time>
                </div>
                <h3 className="font-semibold">{inc.location}</h3>
                <p className="mt-2 text-sm text-mdt-muted">{inc.description}</p>
                <p className="mt-2 text-xs text-mdt-muted">
                  {messages.dispatch.callerName}: {inc.callerName} · {inc.callerPhone}
                </p>
              </div>
              <Link
                href="/dispatch"
                className="shrink-0 rounded-lg border border-neon-blue/30 px-3 py-1.5 text-xs font-semibold text-neon-blue hover:bg-neon-blue/10"
              >
                {messages.incidents.viewOnMap}
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
