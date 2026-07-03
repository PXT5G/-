"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, Search } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { registryWeapons, searchWeapons } from "@/lib/data/weapons-registry";

export function WeaponsRegistry() {
  const [query, setQuery] = useState("");
  const weapons = useMemo(() => searchWeapons(query), [query]);

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon-red/40 bg-neon-red/10">
          <Crosshair className="h-6 w-6 text-neon-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{messages.weapons.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.weapons.subtitle}</p>
        </div>
      </header>

      <Panel>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={messages.weapons.searchPlaceholder}
            className="w-full rounded-xl border border-mdt-panel-border bg-slate-950 py-3 ps-10 pe-4 text-sm outline-none focus:border-neon-red/50"
          />
        </div>

        <ul className="stagger-children space-y-2">
          {weapons.map((w) => (
            <li
              key={w.id}
              className="card-hover flex flex-wrap items-center justify-between gap-3 rounded-lg border border-mdt-panel-border px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-bold">{w.serial}</p>
                <p className="text-sm">{w.type}</p>
                <p className="text-xs text-mdt-muted">{messages.weapons.owner}: {w.owner}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  label={w.status}
                  variant={w.status === "مسروق" ? "red" : w.status === "معلّق" ? "amber" : "green"}
                />
                {w.ownerId && (
                  <Link href={`/doj/${w.ownerId}`} className="text-xs text-neon-blue hover:underline">
                    {messages.weapons.viewOwner}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
