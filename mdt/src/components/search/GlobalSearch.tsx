"use client";

import { Search } from "lucide-react";
import { messages } from "@/lib/i18n/messages";

interface GlobalSearchProps {
  onOpenPalette: () => void;
}

export function GlobalSearch({ onOpenPalette }: GlobalSearchProps) {
  return (
    <button
      type="button"
      onClick={onOpenPalette}
      className="relative flex w-full max-w-xl items-center gap-3 rounded-lg border border-mdt-panel-border bg-slate-950 py-2.5 ps-10 pe-3 text-start text-sm text-mdt-muted transition-colors hover:border-[var(--mdt-accent)]/40 hover:text-mdt-foreground"
    >
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <span className="flex-1 truncate">{messages.search.placeholder}</span>
      <kbd className="hidden rounded border border-mdt-panel-border px-1.5 py-0.5 text-[10px] sm:inline">
        Ctrl+K
      </kbd>
    </button>
  );
}
