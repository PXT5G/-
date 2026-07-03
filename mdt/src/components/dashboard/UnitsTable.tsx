import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { units } from "@/lib/data/mock";
import type { UnitStatus } from "@/types";

function statusVariant(status: UnitStatus): "green" | "red" | "blue" | "neutral" {
  switch (status) {
    case "available":
      return "green";
    case "on_scene":
      return "blue";
    case "en_route":
      return "blue";
    case "busy":
      return "red";
    default:
      return "neutral";
  }
}

function statusLabel(status: UnitStatus): string {
  const map: Record<UnitStatus, keyof typeof messages.status> = {
    available: "available",
    busy: "busy",
    en_route: "enRoute",
    on_scene: "onScene",
  };
  return messages.status[map[status]];
}

export function UnitsTable() {
  return (
    <Panel title={messages.dashboard.units} className="col-span-full min-h-[240px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-mdt-panel-border text-[10px] uppercase tracking-wider text-mdt-muted">
              <th className="pb-2 pe-4 font-semibold">{messages.dashboard.callsign}</th>
              <th className="pb-2 pe-4 font-semibold">{messages.dashboard.name}</th>
              <th className="pb-2 pe-4 font-semibold">{messages.dashboard.rank}</th>
              <th className="pb-2 pe-4 font-semibold">{messages.dashboard.department}</th>
              <th className="pb-2 pe-4 font-semibold">{messages.dashboard.status}</th>
              <th className="pb-2 font-semibold">{messages.dashboard.location}</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr
                key={unit.id}
                className="border-b border-mdt-panel-border/50 last:border-0 hover:bg-slate-800/30"
              >
                <td className="py-2.5 pe-4 font-mono text-xs text-neon-blue">{unit.callsign}</td>
                <td className="py-2.5 pe-4 text-mdt-foreground">{unit.name}</td>
                <td className="py-2.5 pe-4 text-mdt-muted">{unit.rank}</td>
                <td className="py-2.5 pe-4 text-mdt-muted">{unit.department}</td>
                <td className="py-2.5 pe-4">
                  <StatusBadge label={statusLabel(unit.status)} variant={statusVariant(unit.status)} />
                </td>
                <td className="py-2.5 text-mdt-muted">{unit.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Discord Bot API: GET /units/active — live unit roster from Discord bot */}
    </Panel>
  );
}
