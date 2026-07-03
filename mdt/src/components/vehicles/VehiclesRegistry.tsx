"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Car, Search } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { registryVehicles, searchVehicles } from "@/lib/data/vehicles-registry";

export function VehiclesRegistry() {
  const [query, setQuery] = useState("");
  const vehicles = useMemo(() => searchVehicles(query), [query]);

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl accent-border accent-bg accent-glow">
          <Car className="h-6 w-6 accent-text" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{messages.vehicles.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.vehicles.subtitle}</p>
        </div>
      </header>

      <Panel>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={messages.vehicles.searchPlaceholder}
            className="w-full rounded-xl border border-mdt-panel-border bg-slate-950 py-3 ps-10 pe-4 text-sm outline-none focus:border-[var(--mdt-accent)]/50"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-mdt-panel-border text-xs text-mdt-muted">
                <th className="py-2 text-start font-semibold">{messages.vehicles.plate}</th>
                <th className="py-2 text-start font-semibold">{messages.vehicles.model}</th>
                <th className="py-2 text-start font-semibold">{messages.vehicles.color}</th>
                <th className="py-2 text-start font-semibold">{messages.vehicles.owner}</th>
                <th className="py-2 text-start font-semibold">{messages.dashboard.status}</th>
                <th className="py-2 text-start font-semibold" />
              </tr>
            </thead>
            <tbody className="stagger-children">
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-mdt-panel-border/50 hover:bg-slate-800/30">
                  <td className="py-3 font-mono font-bold">{v.plate}</td>
                  <td className="py-3">{v.model}</td>
                  <td className="py-3">{v.color}</td>
                  <td className="py-3">{v.owner}</td>
                  <td className="py-3">
                    <StatusBadge
                      label={v.status}
                      variant={v.status === "مطلوب" ? "red" : "green"}
                    />
                  </td>
                  <td className="py-3">
                    {v.ownerId && (
                      <Link
                        href={`/doj/${v.ownerId}`}
                        className="text-xs accent-text hover:underline"
                      >
                        {messages.vehicles.viewOwner}
                      </Link>
                    )}
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
