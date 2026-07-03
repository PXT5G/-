"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EvidenceLockerGrid } from "./EvidenceLockerGrid";
import { messages } from "@/lib/i18n/messages";
import { evidenceLockerItems } from "@/lib/data/mock";
import { getReportDetails } from "@/lib/data/report-details";
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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { openFineModal } = useMdt();
  const details = getReportDetails(reportId);

  return (
    <div className="page-enter space-y-4">
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
                  ? "accent-bg accent-text accent-border border"
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
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-mdt-muted">{messages.reports.reportId}</p>
                <p className="font-mono font-bold">{reportId}</p>
              </div>
              <div>
                <p className="text-xs text-mdt-muted">{messages.dashboard.status}</p>
                <p>{details.overview.status}</p>
              </div>
              <div>
                <p className="text-xs text-mdt-muted">الضابط</p>
                <p>{details.overview.officer}</p>
              </div>
            </div>
            <p className="leading-relaxed text-mdt-foreground">{details.overview.summary}</p>
            <p className="text-xs text-mdt-muted">
              {new Date(details.overview.createdAt).toLocaleString("ar-SA")}
            </p>
          </div>
        )}
        {activeTab === "peopleInvolved" && (
          <ul className="space-y-2">
            {details.people.length === 0 ? (
              <p className="text-sm text-mdt-muted">{messages.doj.noData}</p>
            ) : (
              details.people.map((p) => (
                <li key={p.id} className="rounded-lg border border-mdt-panel-border px-4 py-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-mdt-muted">{p.role}</p>
                  {p.notes && <p className="mt-1 text-xs text-neon-red">{p.notes}</p>}
                </li>
              ))
            )}
          </ul>
        )}
        {activeTab === "vehicles" && (
          <ul className="space-y-2">
            {details.vehicles.length === 0 ? (
              <p className="text-sm text-mdt-muted">{messages.doj.noData}</p>
            ) : (
              details.vehicles.map((v) => (
                <li key={v.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-mdt-panel-border px-4 py-3">
                  <span className="font-mono font-bold">{v.plate}</span>
                  <span>{v.model} — {v.color}</span>
                  {v.owner && <span className="text-xs text-mdt-muted">{v.owner}</span>}
                </li>
              ))
            )}
          </ul>
        )}
        {activeTab === "evidence" && (
          <ul className="space-y-2">
            {details.evidence.map((e) => (
              <li key={e.id} className="rounded-lg border border-mdt-panel-border px-4 py-3">
                <p className="font-semibold">{e.name}</p>
                <p className="text-xs text-mdt-muted">{e.description}</p>
                <p className="mt-1 text-[10px] text-mdt-muted">{e.collectedAt}</p>
              </li>
            ))}
          </ul>
        )}
        {activeTab === "evidenceLocker" && (
          <EvidenceLockerGrid items={evidenceLockerItems} />
        )}
      </Panel>
    </div>
  );
}
