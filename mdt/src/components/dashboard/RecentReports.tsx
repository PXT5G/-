import Link from "next/link";
import { MapPin } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { recentReports } from "@/lib/data/mock";

export function RecentReports() {
  return (
    <Panel
      title={messages.dashboard.recentReports}
      action={
        <Link href="/reports" className="text-xs text-neon-blue hover:underline">
          {messages.common.viewAll}
        </Link>
      }
      className="h-full min-h-[220px]"
    >
      <ul className="space-y-2">
        {recentReports.map((report) => (
          <li key={report.id}>
            <Link
              href={`/reports/${report.id}`}
              className="group flex items-center justify-between gap-3 rounded-md border border-mdt-panel-border bg-slate-900/40 px-3 py-2.5 transition-colors hover:border-neon-blue/30 hover:bg-neon-blue/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-mdt-foreground group-hover:text-neon-blue">
                  {report.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-mdt-muted">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{report.location}</span>
                </p>
              </div>
              <time className="shrink-0 text-[10px] text-mdt-muted" dateTime={report.date}>
                {report.date}
              </time>
            </Link>
          </li>
        ))}
      </ul>
      {/* Discord Bot API: GET /reports?limit=5 — recent report summaries */}
    </Panel>
  );
}
