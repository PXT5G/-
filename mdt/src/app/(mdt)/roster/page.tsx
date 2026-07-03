"use client";

import { Download } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { dutyLogs, rankChangeLogs } from "@/lib/data/extended-mock";

import { useNotifications } from "@/context/NotificationContext";

export default function RosterPage() {
  const { toast } = useNotifications();

  const exportDuty = async () => {
    await fetch("/api/mdt/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "duty", data: dutyLogs }),
    });
    toast({ title: messages.roster.exportSuccess, variant: "success" });
  };

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.roster.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.roster.autoTracked}</p>
        </div>
        <button
          type="button"
          onClick={exportDuty}
          className="flex items-center gap-2 rounded-lg border border-neon-blue/40 px-4 py-2 text-sm text-neon-blue hover:bg-neon-blue/10"
        >
          <Download className="h-4 w-4" />
          {messages.roster.exportDuty}
        </button>
      </header>

      <Panel title={messages.roster.dutyLogs}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mdt-panel-border text-[10px] uppercase text-mdt-muted">
              <th className="pb-2 pe-4 text-start">{messages.dashboard.name}</th>
              <th className="pb-2 pe-4 text-start">{messages.dashboard.department}</th>
              <th className="pb-2 pe-4 text-start">{messages.dashboard.status}</th>
              <th className="pb-2 text-start">الوقت</th>
            </tr>
          </thead>
          <tbody>
            {dutyLogs.map((log) => (
              <tr key={log.id} className="border-b border-mdt-panel-border/50">
                <td className="py-2.5 pe-4">{log.officerName}</td>
                <td className="py-2.5 pe-4 text-mdt-muted">{log.department}</td>
                <td className="py-2.5 pe-4">
                  <StatusBadge
                    label={log.action === "on_duty" ? messages.profile.onDuty : messages.profile.offDuty}
                    variant={log.action === "on_duty" ? "green" : "red"}
                  />
                </td>
                <td className="py-2.5 text-xs text-mdt-muted">
                  {new Date(log.timestamp).toLocaleString("ar-SA")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title={messages.admin.rankLogs}>
        <ul className="space-y-2">
          {rankChangeLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-mdt-panel-border px-4 py-3 text-sm">
              <span className="font-semibold">{log.officerName}</span>
              <span className="text-mdt-muted"> — {log.fromRank} → {log.toRank}</span>
              <StatusBadge
                label={log.type === "promotion" ? "ترقية" : "تنزيل"}
                variant={log.type === "promotion" ? "green" : "red"}
                className="ms-2"
              />
              <p className="mt-1 text-xs text-mdt-muted">
                {new Date(log.timestamp).toLocaleString("ar-SA")} — {log.authorizedBy}
              </p>
            </li>
          ))}
        </ul>
        {/* Discord Bot API: auto promotion/demotion logs from rank changes */}
      </Panel>
    </div>
  );
}
