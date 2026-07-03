import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { activeWarrants } from "@/lib/data/mock";

export function ActiveWarrants() {
  return (
    <Panel title={messages.dashboard.activeWarrants} className="h-full min-h-[200px]">
      <ul className="space-y-2">
        {activeWarrants.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between gap-3 rounded-md border border-mdt-panel-border bg-slate-900/40 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-mdt-foreground">{w.targetName}</p>
              <p className="text-xs text-mdt-muted">
                {messages.dashboard.issueDate}: {w.issueDate}
              </p>
            </div>
            <StatusBadge
              label={messages.status[w.status]}
              variant={w.status === "active" ? "red" : "neutral"}
            />
          </li>
        ))}
      </ul>
      {/* Discord Bot API: GET /warrants?status=active */}
    </Panel>
  );
}
