"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import type { AuditEntry } from "@/lib/auth/types";

export default function AdminLogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit?limit=50")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.admin.auditLog}</h1>
      </header>

      <Panel>
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mdt-panel-border px-4 py-2.5 text-sm"
            >
              <div>
                <span className="font-mono text-neon-blue">{e.action}</span>
                <span className="text-mdt-muted"> — {e.actorName}</span>
                {e.details && <p className="text-xs text-mdt-muted">{e.details}</p>}
              </div>
              <time className="text-xs text-mdt-muted">
                {new Date(e.timestamp).toLocaleString("ar-SA")}
              </time>
            </li>
          ))}
          {entries.length === 0 && (
            <p className="text-center text-mdt-muted">{messages.common.loading}</p>
          )}
        </ul>
      </Panel>
    </div>
  );
}
