"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Scale, Fingerprint, Phone, Car } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { citizenDossiers, searchDossiers } from "@/lib/data/doj-dossiers";
import { useNotifications } from "@/context/NotificationContext";
import { CitizenAvatar } from "./CitizenAvatar";
import { cn } from "@/lib/utils/cn";

import type { CitizenDossier } from "@/types/doj-dossier";

type SearchMode = "name" | "id" | "phone" | "plate";

export function DojSearchHub() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("name");
  const [remoteResults, setRemoteResults] = useState<CitizenDossier[] | null>(null);
  const { toast } = useNotifications();

  const localResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchDossiers(query, mode);
  }, [query, mode]);

  const displayList = query.trim()
    ? (remoteResults ?? localResults)
    : citizenDossiers;

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: messages.doj.enterQuery, variant: "warning" });
      return;
    }

    let hits = localResults;
    try {
      const res = await fetch(
        `/api/mdt/citizens?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          hits = data.results as CitizenDossier[];
          setRemoteResults(hits);
        }
      }
    } catch {
      setRemoteResults(null);
    }

    if (hits.length === 0) {
      toast({ title: messages.doj.noResults, message: `لا يوجد سجل لـ "${query}"`, variant: "info" });
    } else {
      toast({
        title: messages.doj.resultsFound,
        message: `${hits.length} ملف(ات)`,
        variant: "success",
      });
    }
  };

  const modes: { key: SearchMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "name", label: messages.doj.searchByName, icon: Search },
    { key: "id", label: messages.doj.searchById, icon: Fingerprint },
    { key: "phone", label: messages.doj.searchByPhone, icon: Phone },
    { key: "plate", label: messages.doj.searchByPlate, icon: Car },
  ];

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10">
          <Scale className="h-6 w-6 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{messages.doj.title}</h1>
          <p className="text-sm text-mdt-muted">{messages.doj.subtitle}</p>
        </div>
      </header>

      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                mode === key
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                  : "border-mdt-panel-border text-mdt-muted hover:text-mdt-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mdt-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setRemoteResults(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={messages.doj.searchPlaceholder}
              className="w-full rounded-xl border border-mdt-panel-border bg-slate-950 py-3 ps-10 pe-4 text-sm outline-none transition-all focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl border border-amber-400/40 bg-amber-400/15 px-6 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-400/25"
          >
            {messages.doj.search}
          </button>
        </div>
        {/* Discord Bot API: GET /doj/search?q=&mode= — full citizen dossier from backend */}
      </Panel>

      {(displayList.length > 0 || !query) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayList.map((d) => (
            <Link
              key={d.id}
              href={`/doj/${d.id}`}
              className="card-hover mdt-panel group rounded-xl p-4 transition-all hover:border-amber-400/30"
            >
              <div className="flex items-start gap-4">
                <CitizenAvatar seed={d.photoSeed} name={d.fullName} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold group-hover:text-amber-300">{d.fullName}</h3>
                  <p className="font-mono text-xs text-mdt-muted">{d.nationalId}</p>
                  <p className="mt-1 text-xs text-mdt-muted">{d.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.warrants > 0 && (
                      <StatusBadge label={`${d.warrants} مذكرة`} variant="red" />
                    )}
                    {d.flags.slice(0, 2).map((f) => (
                      <StatusBadge key={f} label={f} variant="red" />
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
