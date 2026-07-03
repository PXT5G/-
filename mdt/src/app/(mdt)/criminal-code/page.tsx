"use client";

import { useState } from "react";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { criminalCharges as initialCharges } from "@/lib/data/extended-mock";
import type { CriminalCharge } from "@/types/mdt-extended";

export default function CriminalCodePage() {
  const [charges, setCharges] = useState(initialCharges);
  const [saved, setSaved] = useState(false);

  const update = (id: string, patch: Partial<CriminalCharge>) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSaved(false);
  };

  const handleSave = async () => {
    // Discord Bot API: PUT /criminal-code — live charge editing (no restart)
    await fetch("/api/mdt/charges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ charges }),
    }).catch(() => {});
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.criminalCode.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.criminalCode.liveEdit}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg border border-neon-green/40 bg-neon-green/10 px-4 py-2 text-sm font-semibold text-neon-green"
        >
          <Save className="h-4 w-4" />
          {saved ? messages.common.success : messages.criminalCode.save}
        </button>
      </header>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-mdt-panel-border text-[10px] uppercase text-mdt-muted">
                <th className="pb-2 pe-3 text-start">{messages.criminalCode.code}</th>
                <th className="pb-2 pe-3 text-start">{messages.criminalCode.charge}</th>
                <th className="pb-2 pe-3 text-start">{messages.criminalCode.category}</th>
                <th className="pb-2 pe-3 text-start">{messages.criminalCode.fine}</th>
                <th className="pb-2 pe-3 text-start">{messages.criminalCode.jail}</th>
                <th className="pb-2 text-start">{messages.criminalCode.active}</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((ch) => (
                <tr key={ch.id} className="border-b border-mdt-panel-border/50">
                  <td className="py-2 pe-3 font-mono text-neon-blue">{ch.code}</td>
                  <td className="py-2 pe-3">
                    <input
                      value={ch.label}
                      onChange={(e) => update(ch.id, { label: e.target.value })}
                      className="w-full rounded border border-mdt-panel-border bg-slate-950 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pe-3">
                    <input
                      value={ch.category}
                      onChange={(e) => update(ch.id, { category: e.target.value })}
                      className="w-full rounded border border-mdt-panel-border bg-slate-950 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pe-3">
                    <input
                      type="number"
                      value={ch.fine}
                      onChange={(e) => update(ch.id, { fine: Number(e.target.value) })}
                      className="w-24 rounded border border-mdt-panel-border bg-slate-950 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pe-3">
                    <input
                      type="number"
                      value={ch.jailMonths}
                      onChange={(e) => update(ch.id, { jailMonths: Number(e.target.value) })}
                      className="w-20 rounded border border-mdt-panel-border bg-slate-950 px-2 py-1"
                    />
                  </td>
                  <td className="py-2">
                    <button type="button" onClick={() => update(ch.id, { active: !ch.active })}>
                      {ch.active ? (
                        <ToggleRight className="h-6 w-6 text-neon-green" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-mdt-muted" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
