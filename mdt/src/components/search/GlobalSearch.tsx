"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { messages } from "@/lib/i18n/messages";
import { citizens } from "@/lib/data/extended-mock";
import { recentReports } from "@/lib/data/mock";
import Link from "next/link";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const citizenHits = q
    ? citizens.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    : [];
  const reportHits = q
    ? recentReports.filter((r) => r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q))
    : [];

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={messages.search.placeholder}
        className="w-full rounded-lg border border-mdt-panel-border bg-slate-950 py-2.5 ps-10 pe-3 text-sm outline-none focus:border-neon-blue/50"
      />
      {open && q && (citizenHits.length > 0 || reportHits.length > 0) && (
        <div className="absolute start-0 top-full z-50 mt-1 w-full rounded-lg border border-mdt-panel-border bg-slate-950 shadow-xl">
          {citizenHits.length > 0 && (
            <div className="border-b border-mdt-panel-border p-2">
              <p className="px-2 py-1 text-[10px] uppercase text-mdt-muted">{messages.search.citizens}</p>
              {citizenHits.map((c) => (
                <Link key={c.id} href={`/citizens?id=${c.id}`} className="block rounded px-2 py-1.5 text-sm hover:bg-slate-800">
                  {c.name} — {c.phone}
                </Link>
              ))}
            </div>
          )}
          {reportHits.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] uppercase text-mdt-muted">{messages.search.reports}</p>
              {reportHits.map((r) => (
                <Link key={r.id} href={`/reports/${r.id}`} className="block rounded px-2 py-1.5 text-sm hover:bg-slate-800">
                  {r.name}
                </Link>
              ))}
            </div>
          )}
          {/* Discord Bot API: GET /search?q= — advanced multi-criteria search */}
        </div>
      )}
    </div>
  );
}
