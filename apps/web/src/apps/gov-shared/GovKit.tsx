'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Shared presentational kit for the three government apps (Police, Justice,
 * EMS). Matches the existing gov design language (dark glass cards, gold
 * accent) so no visual language changes — it only replaces raw JSON dumps
 * and "coming soon" placeholders with structured, production-grade views.
 */

export function GlassCard({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', onClick && 'cursor-pointer active:bg-white/10 transition-colors', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <p className="text-red-400 text-center py-12 text-sm">{message}</p>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-white/40 text-center py-12 text-sm">{message}</p>;
}

const BADGE_TONES: Record<string, string> = {
  gold: 'bg-gulf-gold/20 text-gulf-gold',
  red: 'bg-red-500/25 text-red-300',
  green: 'bg-green-500/25 text-green-300',
  blue: 'bg-blue-500/25 text-blue-300',
  purple: 'bg-purple-500/25 text-purple-300',
  yellow: 'bg-yellow-500/25 text-yellow-300',
  gray: 'bg-white/10 text-white/60',
};

export function Badge({ label, tone = 'gray' }: { label: string; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide', BADGE_TONES[tone])}>
      {label}
    </span>
  );
}

/** Status → tone mapping shared across gov domains */
export function statusTone(status?: string): keyof typeof BADGE_TONES {
  switch (status) {
    case 'active': case 'open': case 'filed': case 'issued': case 'available': case 'on_duty': case 'approved': case 'guilty':
      return 'green';
    case 'pending': case 'draft': case 'investigating': case 'scheduled': case 'contested': case 'break': case 'under_review':
      return 'yellow';
    case 'resolved': case 'closed': case 'served': case 'paid': case 'discharged': case 'off_duty': case 'dismissed':
      return 'gray';
    case 'panic': case 'critical': case 'high': case 'extreme': case 'denied': case 'en_route':
      return 'red';
    default:
      return 'gold';
  }
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className="text-white/80 text-xs text-right break-words">{value}</span>
    </div>
  );
}

export function RecordCard({
  title,
  subtitle,
  status,
  statusToneOverride,
  meta,
  rows,
  chips,
  footer,
  onClick,
}: {
  title: string;
  subtitle?: string;
  status?: string;
  statusToneOverride?: keyof typeof BADGE_TONES;
  meta?: string;
  rows?: { label: string; value: ReactNode }[];
  chips?: string[];
  footer?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <GlassCard className="p-4" onClick={onClick}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">{title}</p>
          {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {status && <Badge label={status.replace(/_/g, ' ')} tone={statusToneOverride ?? statusTone(status)} />}
      </div>
      {meta && <p className="text-white/40 text-xs mb-1">{meta}</p>}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 my-2">
          {chips.map((c, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/70">{c}</span>
          ))}
        </div>
      )}
      {rows && rows.length > 0 && <div className="mt-2 border-t border-white/5 pt-2">{rows.map((r, i) => <Row key={i} label={r.label} value={r.value} />)}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </GlassCard>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-white font-bold text-lg">{children}</h2>
      {action}
    </div>
  );
}

export function PrimaryButton({ label, onClick, disabled, tone = 'gold' }: { label: string; onClick: () => void; disabled?: boolean; tone?: 'gold' | 'red' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors',
        tone === 'gold' ? 'bg-gulf-gold text-black' : 'bg-red-600/90 text-white',
      )}
    >
      {label}
    </button>
  );
}

export function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-white/50 text-xs">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-white/30"
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-white/50 text-xs">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-white/30 resize-none"
      />
    </label>
  );
}

export function Segmented({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn('px-3 py-1.5 rounded-full text-xs transition-colors', value === id ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Collapsible "New record" form container with a toggle */
export function CreatePanel({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <GlassCard className="p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-gulf-gold text-sm font-semibold"
      >
        <span>+ {label}</span>
        <span className="text-white/40">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </GlassCard>
  );
}

/** Domain-aware structured rendering of search results (replaces raw JSON dumps) */
export function StructuredResults({ results, type }: { results: unknown; type: string }) {
  const list = Array.isArray(results) ? results : results !== null && results !== undefined ? [results] : [];
  if (list.length === 0) return <EmptyState message="No results found" />;
  return (
    <div className="space-y-3">
      <p className="text-white/40 text-xs uppercase">{list.length} result{list.length !== 1 ? 's' : ''}</p>
      {list.map((raw, i) => {
        const r = raw as Record<string, unknown>;
        const rows = Object.entries(r)
          .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
          .slice(0, 8)
          .map(([label, value]) => ({
            label: label.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
            value: String(value),
          }));
        const title = String(r.name ?? r.displayName ?? r.patientName ?? r.plateNumber ?? r.phoneNumber ?? r.caseNumber ?? r.title ?? `${type} result`);
        const flags = Array.isArray(r.warrants ?? r.activeWarrants) ? (r.warrants ?? r.activeWarrants) as unknown[] : [];
        return (
          <RecordCard
            key={i}
            title={title}
            subtitle={String(r.address ?? r.district ?? '') || undefined}
            status={flags.length > 0 ? 'wanted' : undefined}
            statusToneOverride={flags.length > 0 ? 'red' : undefined}
            rows={rows}
          />
        );
      })}
    </div>
  );
}

/** Client-side filter + sort bar for enterprise search UX */
export function FilterBar({
  query, onQuery, sort, onSort, sortOptions,
}: {
  query: string; onQuery: (v: string) => void;
  sort?: string; onSort?: (v: string) => void; sortOptions?: [string, string][];
}) {
  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Filter records..."
        className="w-full bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-white/30"
      />
      {sortOptions && onSort && (
        <div className="flex flex-wrap gap-2">
          {sortOptions.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSort(id)}
              className={cn('px-2.5 py-1 rounded-lg text-[11px]', sort === id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
