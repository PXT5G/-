"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OfficerCard } from "@/components/officers/OfficerCard";
import { messages } from "@/lib/i18n/messages";
import { officers } from "@/lib/data/mock";

export default function OfficersPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return officers;
    return officers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.rank.toLowerCase().includes(q) ||
        o.department.toLowerCase().includes(q) ||
        o.badges.some((b) => b.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-mdt-foreground">
          {messages.officers.title}
        </h1>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={messages.officers.searchPlaceholder}
            className="w-full rounded-md border border-mdt-panel-border bg-slate-950 py-2.5 ps-10 pe-3 text-sm text-mdt-foreground outline-none focus:border-neon-blue/50"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((officer) => (
          <OfficerCard key={officer.id} officer={officer} />
        ))}
      </div>
      {/* Discord Bot API: GET /officers — roster with duty hours & specializations */}
    </div>
  );
}
