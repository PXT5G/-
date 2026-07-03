import { Phone, User } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { dispatchIncidents } from "@/lib/data/mock";

export function RecentIncidents() {
  return (
    <Panel title={messages.dispatch.recentIncidents} className="h-full">
      <ul className="mdt-scroll max-h-[520px] space-y-3 overflow-y-auto pe-1">
        {dispatchIncidents.map((inc) => (
          <li
            key={inc.id}
            className="rounded-md border border-mdt-panel-border bg-slate-900/50 p-3 transition-colors hover:border-neon-blue/30"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-neon-blue">
                {messages.dispatch.callNumber} {inc.callNumber}
              </span>
              <time className="text-[10px] text-mdt-muted">{inc.time}</time>
            </div>
            <p className="text-sm font-medium text-mdt-foreground">{inc.location}</p>
            <p className="mt-2 text-xs leading-relaxed text-mdt-muted">{inc.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 border-t border-mdt-panel-border pt-2 text-xs text-mdt-muted">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden />
                {messages.dispatch.callerName}: {inc.callerName}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" aria-hidden />
                {messages.dispatch.phone}: {inc.callerPhone}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {/* Discord Bot API: GET /dispatch/incidents?recent=true */}
    </Panel>
  );
}
