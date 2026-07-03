import { Package } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import type { EvidenceItem } from "@/types";

interface EvidenceLockerGridProps {
  items: EvidenceItem[];
}

export function EvidenceLockerGrid({ items }: EvidenceLockerGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="mdt-panel flex flex-col rounded-lg p-4 transition-colors hover:border-neon-green/30"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-mdt-panel-border bg-slate-900/60">
              <Package className="h-5 w-5 text-mdt-muted" aria-hidden />
            </div>
            {item.secured && (
              <StatusBadge label={messages.reports.secured} variant="green" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-mdt-foreground">{item.name}</h3>
          <p className="mt-1 text-xs text-mdt-muted">
            {messages.reports.category}: {item.category}
          </p>
          <p className="mt-1 text-xs text-mdt-muted">
            {messages.reports.quantity}: {item.quantity}
          </p>
          <p className="mt-2 font-mono text-[10px] text-neon-blue">
            {messages.reports.reportId}: {item.reportId}
          </p>
        </article>
      ))}
      {/*
        Discord Bot API integration points:
        - GET  /reports/{reportId}/evidence-locker  → fetch inventory items from Discord bot DB
        - POST /reports/{reportId}/evidence         → add item to locker
        - PATCH /evidence/{itemId}                  → update secured status / quantity
      */}
    </div>
  );
}
