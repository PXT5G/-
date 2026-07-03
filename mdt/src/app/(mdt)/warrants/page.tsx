"use client";

import { Download } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { activeWarrants } from "@/lib/data/mock";

export default function WarrantsPage() {
  const exportWarrants = async () => {
    await fetch("/api/mdt/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "warrants", data: activeWarrants }),
    });
    alert("تم إرسال المذكرات إلى Discord DM");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{messages.warrants.title}</h1>
        <button
          type="button"
          onClick={exportWarrants}
          className="flex items-center gap-2 rounded-lg border border-neon-blue/40 px-4 py-2 text-sm text-neon-blue hover:bg-neon-blue/10"
        >
          <Download className="h-4 w-4" />
          {messages.warrants.export}
        </button>
      </header>

      <Panel>
        <ul className="space-y-2">
          {activeWarrants.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-lg border border-mdt-panel-border px-4 py-3"
            >
              <div>
                <p className="font-semibold">{w.targetName}</p>
                <p className="text-xs text-mdt-muted">{messages.dashboard.issueDate}: {w.issueDate}</p>
              </div>
              <StatusBadge label={messages.status.active} variant="red" />
            </li>
          ))}
        </ul>
      </Panel>
      {/* Discord Bot API: GET /warrants + export to private DM */}
    </div>
  );
}
