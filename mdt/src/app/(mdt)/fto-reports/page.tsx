"use client";

import { Plus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { ftoReports } from "@/lib/data/extended-mock";

export default function FtoReportsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{messages.fto.title}</h1>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 text-sm text-neon-blue"
        >
          <Plus className="h-4 w-4" />
          {messages.fto.newReport}
        </button>
      </header>

      <div className="grid gap-4">
        {ftoReports.map((r) => (
          <Panel key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-mdt-muted">{messages.fto.trainee}</p>
                <p className="text-lg font-semibold">{r.traineeName}</p>
                <p className="mt-2 text-xs text-mdt-muted">
                  {messages.fto.fto}: {r.ftoName} · {messages.fto.phase}: {r.phase}
                </p>
              </div>
              <div className="text-end">
                <StatusBadge
                  label={r.status}
                  variant={r.status === "approved" ? "green" : r.status === "failed" ? "red" : "blue"}
                />
                <p className="mt-2 text-2xl font-bold text-neon-blue">{r.score}%</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-mdt-muted">{r.notes}</p>
          </Panel>
        ))}
      </div>
      {/* Discord Bot API: GET/POST /fto-reports — training progress tracking */}
    </div>
  );
}
