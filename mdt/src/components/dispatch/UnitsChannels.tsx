import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { radioChannels, units } from "@/lib/data/mock";

export function UnitsChannels() {
  const available = units.filter((u) => u.status === "available");
  const attached = units.filter((u) => u.status !== "available");

  return (
    <Panel title={messages.dispatch.unitsAndChannels} className="h-full">
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-mdt-muted">
            {messages.dispatch.availableUnits}
          </h3>
          <ul className="space-y-1.5">
            {available.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded border border-mdt-panel-border bg-slate-900/40 px-2.5 py-2"
              >
                <span className="font-mono text-xs text-neon-blue">{u.callsign}</span>
                <span className="text-xs text-mdt-muted">{u.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-mdt-muted">
            {messages.dispatch.attachedUnits}
          </h3>
          <ul className="space-y-1.5">
            {attached.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded border border-neon-blue/20 bg-neon-blue/5 px-2.5 py-2"
              >
                <span className="font-mono text-xs text-neon-blue">{u.callsign}</span>
                <StatusBadge label={u.status.replace("_", " ")} variant="blue" />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-mdt-muted">
            {messages.dispatch.radioChannels}
          </h3>
          <ul className="space-y-1.5">
            {radioChannels.map((ch) => (
              <li
                key={ch.id}
                className="flex items-center justify-between rounded border border-mdt-panel-border px-2.5 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-mdt-foreground">{ch.name}</p>
                  <p className="font-mono text-[10px] text-mdt-muted">{ch.frequency} MHz</p>
                </div>
                <span className="text-[10px] text-neon-green">{ch.activeUnits} units</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {/* Discord Bot API: GET /dispatch/units and GET /dispatch/channels */}
    </Panel>
  );
}
