"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useMdt } from "@/context/MdtContext";
import { messages } from "@/lib/i18n/messages";
import { sampleCharges } from "@/lib/data/mock";

/**
 * Mock fine processor — production: POST to Discord Webhook / Bot API
 * Example:
 *   await fetch(process.env.NEXT_PUBLIC_DISCORD_FINE_WEBHOOK_URL!, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       embeds: [{
 *         title: "Fine Processed",
 *         fields: [
 *           { name: "Officer", value: officerName },
 *           { name: "Total", value: `$${total}` },
 *           { name: "Charges", value: chargesSummary },
 *         ],
 *       }],
 *     }),
 *   });
 */
async function processFineToDiscord(payload: {
  fineAmount: number;
  charges: { label: string; amount: number }[];
  total: number;
  officerName: string;
}) {
  console.info("[MDT] Discord Webhook — fine log payload:", payload);
  // Discord Bot API: POST /logs/fines or Discord Webhook URL from env
  return { ok: true };
}

export function ProcessFineModal() {
  const { fineModalOpen, closeFineModal, user } = useMdt();
  const [fineAmount, setFineAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charges = sampleCharges;
  const chargesTotal = useMemo(
    () => charges.reduce((sum, c) => sum + c.amount, 0),
    [charges],
  );
  const parsedFine = Number.parseFloat(fineAmount) || 0;
  const grandTotal = chargesTotal + parsedFine;

  if (!fineModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await processFineToDiscord({
        fineAmount: parsedFine,
        charges: charges.map((c) => ({ label: c.label, amount: c.amount })),
        total: grandTotal,
        officerName: user.name,
      });
      closeFineModal();
      setFineAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fine-modal-title"
    >
      <div className="mdt-panel w-full max-w-lg rounded-xl border border-mdt-panel-border shadow-2xl">
        <div className="flex items-center justify-between border-b border-mdt-panel-border px-5 py-4">
          <h2 id="fine-modal-title" className="text-lg font-bold text-mdt-foreground">
            {messages.fineModal.title}
          </h2>
          <button
            type="button"
            onClick={closeFineModal}
            className="rounded-md p-1 text-mdt-muted transition-colors hover:bg-slate-800 hover:text-mdt-foreground"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label htmlFor="fine-amount" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdt-muted">
              {messages.fineModal.fineAmount}
            </label>
            <input
              id="fine-amount"
              type="number"
              min="0"
              step="1"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              className="w-full rounded-md border border-mdt-panel-border bg-slate-950 px-3 py-2.5 text-sm text-mdt-foreground outline-none transition-colors focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30"
              placeholder="0"
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mdt-muted">
              {messages.fineModal.chargesSummary}
            </h3>
            <ul className="space-y-2 rounded-md border border-mdt-panel-border bg-slate-950/60 p-3">
              {charges.map((charge) => (
                <li key={charge.id} className="flex items-center justify-between text-sm">
                  <span className="text-mdt-foreground">{charge.label}</span>
                  <span className="font-mono text-neon-red">${charge.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-mdt-panel-border pt-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-mdt-muted">
              {messages.fineModal.total}
            </span>
            <span className="font-mono text-xl font-bold text-neon-green">
              ${grandTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeFineModal}
              className="rounded-md border border-mdt-panel-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-mdt-muted hover:bg-slate-800"
            >
              {messages.fineModal.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md border border-neon-green/40 bg-neon-green/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neon-green transition-colors hover:bg-neon-green/25 disabled:opacity-50"
            >
              {messages.fineModal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
