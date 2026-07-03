"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutDashboard, Search, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { searchCommands, type CommandItem } from "@/lib/search/command-index";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";

const typeIcons = {
  page: LayoutDashboard,
  citizen: User,
  report: FileText,
  action: Search,
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { can } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchCommands(query, can), [query, can]);

  const navigate = useCallback(
    (item: CommandItem) => {
      router.push(item.href);
      onClose();
      setQuery("");
    },
    [router, onClose],
  );

  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIdx]) {
        e.preventDefault();
        navigate(results[activeIdx]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIdx, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="dropdown-enter w-full max-w-xl overflow-hidden rounded-2xl border border-mdt-panel-border bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={messages.search.commandPalette}
      >
        <div className="flex items-center gap-3 border-b border-mdt-panel-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-mdt-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={messages.search.placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-mdt-muted"
          />
          <kbd className="hidden rounded border border-mdt-panel-border px-1.5 py-0.5 text-[10px] text-mdt-muted sm:inline">
            ESC
          </kbd>
          <button type="button" onClick={onClose} className="text-mdt-muted hover:text-mdt-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mdt-scroll max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-mdt-muted">
              {messages.search.noResults}
            </li>
          ) : (
            results.map((item, idx) => {
              const Icon = typeIcons[item.type];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors",
                      idx === activeIdx
                        ? "bg-[var(--mdt-accent)]/15 text-[var(--mdt-accent)]"
                        : "text-mdt-foreground hover:bg-slate-800/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-mdt-muted">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase text-mdt-muted">
                      {item.type === "page"
                        ? messages.search.pages
                        : item.type === "citizen"
                          ? messages.search.citizens
                          : messages.search.reports}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-mdt-panel-border px-4 py-2 text-[10px] text-mdt-muted">
          <span>{messages.search.hintNavigate}</span>
          <kbd className="rounded border border-mdt-panel-border px-1.5 py-0.5">Ctrl+K</kbd>
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
