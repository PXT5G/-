import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { recentReports } from "@/lib/data/mock";

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-mdt-foreground">{messages.reports.title}</h1>
      </header>
      <Panel title={messages.dashboard.recentReports}>
        <ul className="space-y-2">
          {recentReports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="block rounded-md border border-mdt-panel-border px-3 py-2 text-sm text-neon-blue hover:bg-neon-blue/5"
              >
                {r.name} — {r.location}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
