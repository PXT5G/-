import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { bolos } from "@/lib/data/mock";

export function BOLOs() {
  return (
    <Panel title={messages.dashboard.bolos} className="h-full min-h-[200px]">
      <ul className="space-y-2">
        {bolos.map((bolo) => (
          <li
            key={bolo.id}
            className="rounded-md border border-mdt-panel-border bg-slate-900/40 px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-mdt-foreground">{bolo.target}</p>
                {bolo.vehicle && (
                  <p className="mt-0.5 text-xs text-mdt-muted">
                    {messages.dashboard.vehicle}: {bolo.vehicle}
                  </p>
                )}
              </div>
              <StatusBadge
                label={messages.status[bolo.status]}
                variant={bolo.status === "active" ? "red" : "green"}
              />
            </div>
          </li>
        ))}
      </ul>
      {/* Discord Bot API: GET /bolos?status=active */}
    </Panel>
  );
}
