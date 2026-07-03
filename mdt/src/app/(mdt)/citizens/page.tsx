"use client";

import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { citizens } from "@/lib/data/extended-mock";

export default function CitizensPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.nav.citizens}</h1>
      </header>
      <div className="grid gap-3">
        {citizens.map((c) => (
          <Panel key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <p className="text-sm text-mdt-muted">DOB: {c.dob} · {c.phone}</p>
                <p className="mt-1 text-xs text-mdt-muted">
                  تراخيص: {c.licenses.join("، ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.warrants > 0 && (
                  <StatusBadge label={`${c.warrants} مذكرة`} variant="red" />
                )}
                {c.flags.map((f) => (
                  <StatusBadge key={f} label={f} variant={f === "خطير" ? "red" : "neutral"} />
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {/* Discord Bot API: GET /citizens — citizen database from FiveM framework */}
    </div>
  );
}
