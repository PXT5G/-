"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EvidenceLockerGrid } from "./EvidenceLockerGrid";
import { messages } from "@/lib/i18n/messages";
import { evidenceLockerItems } from "@/lib/data/mock";
import { useMdt } from "@/context/MdtContext";
import { cn } from "@/lib/utils/cn";

type TabKey = keyof typeof messages.reports.tabs;

const tabKeys: TabKey[] = [
  "overview",
  "peopleInvolved",
  "vehicles",
  "evidence",
  "evidenceLocker",
];

export function ReportTabs({ reportId }: { reportId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("evidenceLocker");
  const { openFineModal } = useMdt();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-mdt-panel-border bg-slate-950/50 p-1">
          {tabKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                activeTab === key
                  ? "bg-neon-blue/15 text-neon-blue border border-neon-blue/30"
                  : "text-mdt-muted hover:text-mdt-foreground",
              )}
            >
              {messages.reports.tabs[key]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openFineModal}
          className="flex items-center gap-2 rounded-md border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neon-blue transition-colors hover:bg-neon-blue/20"
        >
          <DollarSign className="h-4 w-4" aria-hidden />
          {messages.reports.processFine}
        </button>
      </div>

      <Panel>
        {activeTab === "overview" && (
          <div className="text-sm text-mdt-muted">
            <p>Report {reportId} — overview content placeholder.</p>
            {/* Discord Bot API: GET /reports/{reportId} */}
          </div>
        )}
        {activeTab === "peopleInvolved" && (
          <p className="text-sm text-mdt-muted">
            {/* Discord Bot API: GET /reports/{reportId}/people */}
            People involved will load from Discord bot records.
          </p>
        )}
        {activeTab === "vehicles" && (
          <p className="text-sm text-mdt-muted">
            {/* Discord Bot API: GET /reports/{reportId}/vehicles */}
            Linked vehicles will load from Discord bot records.
          </p>
        )}
        {activeTab === "evidence" && (
          <p className="text-sm text-mdt-muted">
            {/* Discord Bot API: GET /reports/{reportId}/evidence */}
            General evidence list (non-locker) from Discord bot.
          </p>
        )}
        {activeTab === "evidenceLocker" && (
          <EvidenceLockerGrid items={evidenceLockerItems} />
        )}
      </Panel>
    </div>
  );
}
