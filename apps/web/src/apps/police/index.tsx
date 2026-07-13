'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePoliceDashboard, usePoliceDispatches, usePoliceOfficers, usePoliceUnits,
  usePoliceBolos, usePoliceWanted, usePoliceWarrants, usePoliceAnalytics,
  useUpdatePoliceStatus, usePoliceSearch, usePolicePanic, usePoliceSocketSync, usePoliceInit,
  usePoliceReports, usePoliceCitations, usePoliceCases, usePoliceEvidence,
  usePoliceNotes, usePolicePanics, usePoliceAuditLog, usePoliceCreate,
} from '@/hooks/usePolice';
import { useAuthStore } from '@/stores/authStore';
import { policeService } from '@/services/policeService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';
import {
  GlassCard, LoadingState, ErrorState, EmptyState, RecordCard, SectionTitle,
  PrimaryButton, Field, TextArea, Segmented, CreatePanel, FilterBar, Badge,
  statusTone, StructuredResults,
} from '@/apps/gov-shared/GovKit';

type Tab = 'mdt' | 'units' | 'dispatch' | 'search' | 'more';
type SubScreen = string | null;

const STATUS_COLORS: Record<string, string> = {
  on_duty: 'bg-green-500', off_duty: 'bg-gray-500', break: 'bg-yellow-500',
  en_route: 'bg-blue-500', on_scene: 'bg-purple-500', panic: 'bg-red-600 animate-pulse',
};

function rec(item: unknown) { return item as Record<string, unknown>; }
function str(v: unknown) { return v === undefined || v === null ? '' : String(v); }
function arr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }
function fmtDate(v: unknown) { return v ? new Date(String(v)).toLocaleString() : ''; }

function StatBox({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <GlassCard className={cn('p-3 text-center', alert && value > 0 && 'border-red-500/50')}>
      <p className={cn('text-2xl font-bold', alert && value > 0 ? 'text-red-400' : 'text-gulf-gold')}>{value}</p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function MdtDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { data, isLoading, error } = usePoliceDashboard();
  const updateStatus = useUpdatePoliceStatus();
  const panic = usePolicePanic();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load MDT" />;

  const officer = data.officer as Record<string, string>;
  const stats = data.stats;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gulf-gold text-xs font-semibold uppercase tracking-wider">Officer</p>
            <p className="text-white text-lg font-bold">{officer.displayName ?? 'Officer'}</p>
            <p className="text-white/50 text-sm">{officer.badgeNumber} · {officer.rank}</p>
          </div>
          <div className="text-right">
            <span className={cn('inline-block w-3 h-3 rounded-full mr-1', STATUS_COLORS[officer.status] ?? 'bg-gray-500')} />
            <span className="text-white/70 text-sm capitalize">{officer.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {['on_duty', 'break', 'off_duty'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { tap(); updateStatus.mutate(s); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors',
                officer.status === s ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="911 Calls" value={stats.calls911} alert />
        <StatBox label="Active" value={stats.activeDispatches} />
        <StatBox label="On Duty" value={stats.onDutyOfficers} />
        <StatBox label="BOLOs" value={stats.activeBolos} />
        <StatBox label="Warrants" value={stats.activeWarrants} />
        <StatBox label="Cases" value={stats.openCases} />
      </div>

      <button
        type="button"
        onClick={() => { tap(); panic.mutate(); }}
        className="w-full py-4 rounded-2xl bg-red-600/90 text-white font-bold text-sm uppercase tracking-wider border border-red-400/50"
      >
        🚨 Panic Button
      </button>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['bolo', 'BOLO'], ['wanted', 'Wanted'], ['warrants', 'Warrants'],
            ['reports', 'Reports'], ['citations', 'Citations'], ['cases', 'Cases'],
            ['evidence', 'Evidence'], ['analytics', 'Analytics'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { tap(); onNavigate(id); }}
              className="py-3 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      {arr(data.recentDispatches).length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-white/60 text-xs uppercase mb-3">Recent Dispatches</h3>
          {arr(data.recentDispatches).map((raw) => {
            const d = rec(raw);
            return (
              <div key={str(d.dispatchId)} className="py-2 border-b border-white/5 last:border-0">
                <div className="flex justify-between">
                  <span className="text-white text-sm">{str(d.title)}</span>
                  {Boolean(d.is911) && <span className="text-red-400 text-xs font-bold">911</span>}
                </div>
                <p className="text-white/40 text-xs">{str(d.district ?? d.address)}</p>
              </div>
            );
          })}
        </GlassCard>
      )}
    </div>
  );
}

function UnitsScreen() {
  const { data: officers, isLoading: oLoad } = usePoliceOfficers();
  const { data: units, isLoading: uLoad } = usePoliceUnits();
  if (oLoad || uLoad) return <LoadingState />;

  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Live Units</SectionTitle>
      {arr(units).map((raw) => {
        const u = rec(raw);
        return (
          <RecordCard
            key={str(u.unitId)}
            title={`${str(u.code)} · ${str(u.name)}`}
            status={str(u.status)}
            meta={`${str(u.radioChannel)} · ${str(u.district) || 'No GPS'} · ${str(u.type)}`}
            rows={[
              { label: 'Members', value: arr(u.memberBadges).length || '—' },
              { label: 'Vehicle', value: str(u.vehiclePlate) || '—' },
            ]}
          />
        );
      })}
      <h3 className="text-white/60 text-sm uppercase mt-4">Officers</h3>
      {arr(officers).map((raw) => {
        const o = rec(raw);
        return (
          <GlassCard key={str(o.badgeNumber)} className="p-3 flex justify-between items-center">
            <div>
              <p className="text-white text-sm">{str(o.displayName ?? o.badgeNumber)}</p>
              <p className="text-white/40 text-xs">{str(o.badgeNumber)} · {str(o.rank)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs capitalize">{str(o.status).replace('_', ' ')}</span>
              <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[str(o.status)] ?? 'bg-gray-500')} />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function DispatchScreen() {
  const { data: all, isLoading } = usePoliceDispatches();
  const { data: calls911 } = usePoliceDispatches(true);
  const create = usePoliceCreate();
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => policeService.updateDispatch(token!, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['police'] }),
  });

  if (isLoading) return <LoadingState />;

  const active = arr(all).filter((d) => rec(d).status !== 'resolved');

  return (
    <div className="p-4 space-y-4">
      <SectionTitle>Dispatch Center</SectionTitle>

      <CreatePanel label="New Dispatch">
        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Traffic collision" />
        <TextArea label="Description" value={description} onChange={setDescription} placeholder="Details" />
        <Field label="Address" value={address} onChange={setAddress} placeholder="Location" />
        <PrimaryButton
          label={create.dispatch.isPending ? 'Creating...' : 'Create Dispatch'}
          disabled={!title || !description || create.dispatch.isPending}
          onClick={() => { tap(); create.dispatch.mutate({ callType: 'officer_initiated', priority: 2, title, description, address }, { onSuccess: () => { setTitle(''); setDescription(''); setAddress(''); } }); }}
        />
      </CreatePanel>

      {arr(calls911).length > 0 && (
        <>
          <p className="text-red-400 text-xs font-bold uppercase">911 Calls</p>
          {arr(calls911).map((raw) => (
            <DispatchCard key={str(rec(raw).dispatchId)} dispatch={rec(raw)} onUpdate={(status) => { tap(); update.mutate({ id: str(rec(raw).dispatchId), status }); }} />
          ))}
        </>
      )}
      <p className="text-white/60 text-xs uppercase">Active Calls</p>
      {active.map((raw) => (
        <DispatchCard key={str(rec(raw).dispatchId)} dispatch={rec(raw)} onUpdate={(status) => { tap(); update.mutate({ id: str(rec(raw).dispatchId), status }); }} />
      ))}
      {active.length === 0 && <EmptyState message="No active dispatches" />}
    </div>
  );
}

function DispatchCard({ dispatch: d, onUpdate }: { dispatch: Record<string, unknown>; onUpdate: (status: string) => void }) {
  const priority = Number(d.priority);
  const status = str(d.status);
  const next: Record<string, string> = { pending: 'assigned', assigned: 'en_route', en_route: 'on_scene', on_scene: 'resolved' };
  const nextLabel: Record<string, string> = { pending: 'Accept', assigned: 'En Route', en_route: 'On Scene', on_scene: 'Resolve' };
  return (
    <GlassCard className={cn('p-4', priority === 1 && 'border-red-500/40')}>
      <div className="flex justify-between mb-2 items-start">
        <span className="text-white font-medium text-sm">{str(d.title)}</span>
        <div className="flex gap-1.5">
          <Badge label={`P${priority}`} tone={priority === 1 ? 'red' : 'gray'} />
          <Badge label={status.replace('_', ' ')} tone={statusTone(status)} />
        </div>
      </div>
      <p className="text-white/50 text-xs mb-2">{str(d.description)}</p>
      <p className="text-white/40 text-xs">{str(d.address ?? d.district)}</p>
      {next[status] && (
        <button type="button" onClick={() => onUpdate(next[status])} className="mt-3 w-full py-2 rounded-xl bg-gulf-gold/20 text-gulf-gold text-xs font-semibold">
          {nextLabel[status]}
        </button>
      )}
    </GlassCard>
  );
}

/** Structured, domain-aware search results — no more JSON dumps */
function SearchScreen() {
  const [searchType, setSearchType] = useState('person');
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const search = usePoliceSearch();
  const { tap } = useHaptic();

  const types: [string, string][] = [
    ['person', 'Person'], ['vehicle', 'Vehicle'], ['plate', 'Plate'],
    ['phone', 'Phone'], ['identity', 'Identity'], ['property', 'Property'],
    ['business', 'Business'], ['weapon', 'Weapon License'],
  ];

  const runSearch = () => {
    tap();
    search.mutate({ searchType, query });
    setRecent((r) => [query, ...r.filter((x) => x !== query)].slice(0, 5));
  };

  const results = search.data ? (search.data as Record<string, unknown>).results : undefined;

  return (
    <div className="p-4 space-y-4">
      <SectionTitle>MDT Search</SectionTitle>
      <Segmented options={types} value={searchType} onChange={setSearchType} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && query) runSearch(); }}
        placeholder={`Search ${searchType}...`}
        className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/30"
      />
      <PrimaryButton label={search.isPending ? 'Searching...' : 'Run Search'} disabled={!query || search.isPending} onClick={runSearch} />

      {recent.length > 0 && !results && (
        <div className="flex flex-wrap gap-2">
          {recent.map((r) => (
            <button key={r} type="button" onClick={() => { setQuery(r); }} className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs">🕓 {r}</button>
          ))}
        </div>
      )}

      {results !== undefined && <StructuredResults type={searchType} results={results} />}
      {search.isError && <ErrorState message="Search failed" />}
    </div>
  );
}

/* ─── Structured record screens (replace JSON dumps + "coming soon") ─────── */

function useFilterSort<T>(items: T[], text: (i: T) => string) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => text(i).toLowerCase().includes(q));
  }, [items, query, text]);
  return { query, setQuery, filtered };
}

function BolosScreen() {
  const { data, isLoading } = usePoliceBolos();
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (b) => `${str(b.title)} ${str(b.subjectName)} ${str(b.plateNumber)}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>BOLO Alerts</SectionTitle>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No active BOLOs" /> : filtered.map((b) => (
        <RecordCard
          key={str(b.boloId)}
          title={str(b.title)}
          subtitle={str(b.subjectName ?? b.plateNumber)}
          status={str(b.dangerLevel)}
          statusToneOverride={b.dangerLevel === 'high' || b.dangerLevel === 'extreme' ? 'red' : 'yellow'}
          meta={`${str(b.type)} · Issued by ${str(b.issuedByBadge)}`}
          rows={[{ label: 'Details', value: str(b.description) }, { label: 'Issued', value: fmtDate(b.createdAt) }]}
        />
      ))}
    </div>
  );
}

function WantedScreen() {
  const { data, isLoading } = usePoliceWanted();
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (w) => `${str(w.name)} ${arr(w.charges).join(' ')}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Wanted Persons</SectionTitle>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No wanted persons" /> : filtered.map((w) => (
        <RecordCard
          key={str(w.wantedId)}
          title={str(w.name)}
          subtitle={arr(w.aliases).length ? `AKA ${arr(w.aliases).join(', ')}` : undefined}
          status={str(w.dangerLevel)}
          statusToneOverride={w.dangerLevel === 'high' || w.dangerLevel === 'extreme' ? 'red' : 'yellow'}
          chips={arr(w.charges).map(String)}
          rows={[{ label: 'Last seen', value: `${str(w.lastSeen)} ${str(w.lastSeenDistrict)}` }]}
        />
      ))}
    </div>
  );
}

function WarrantsScreen() {
  const { data, isLoading } = usePoliceWarrants();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [subjectName, setSubjectName] = useState('');
  const [description, setDescription] = useState('');
  const [charges, setCharges] = useState('');
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (w) => `${str(w.subjectName)} ${arr(w.charges).join(' ')}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Arrest Warrants</SectionTitle>
      <CreatePanel label="Request Warrant">
        <Field label="Subject Name" value={subjectName} onChange={setSubjectName} />
        <Field label="Charges (comma separated)" value={charges} onChange={setCharges} />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <PrimaryButton
          label={create.warrant.isPending ? 'Filing...' : 'File Warrant'}
          disabled={!subjectName || !description || create.warrant.isPending}
          onClick={() => { tap(); create.warrant.mutate({ type: 'arrest', subjectName, description, charges: charges.split(',').map((c) => c.trim()).filter(Boolean) }, { onSuccess: () => { setSubjectName(''); setDescription(''); setCharges(''); } }); }}
        />
      </CreatePanel>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No active warrants" /> : filtered.map((w) => (
        <RecordCard
          key={str(w.warrantId)}
          title={str(w.subjectName)}
          subtitle={`${str(w.type)} warrant`}
          status={str(w.status)}
          chips={arr(w.charges).map(String)}
          rows={[{ label: 'Description', value: str(w.description) }, { label: 'Issued by', value: str(w.issuedBy) }, { label: 'Expires', value: fmtDate(w.expiresAt) }]}
        />
      ))}
    </div>
  );
}

function ReportsScreen() {
  const { data, isLoading } = usePoliceReports();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [reportType, setReportType] = useState('incident');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (r) => `${str(r.title)} ${str(r.reportType)} ${str(r.officerBadge)}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Officer Reports</SectionTitle>
      <CreatePanel label="File Report">
        <Segmented options={[['incident', 'Incident'], ['crime', 'Crime'], ['arrest', 'Arrest']]} value={reportType} onChange={setReportType} />
        <Field label="Title" value={title} onChange={setTitle} />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <Field label="Location" value={location} onChange={setLocation} />
        <PrimaryButton
          label={create.report.isPending ? 'Filing...' : 'File Report'}
          disabled={!title || !description || create.report.isPending}
          onClick={() => { tap(); create.report.mutate({ reportType, title, description, location }, { onSuccess: () => { setTitle(''); setDescription(''); setLocation(''); } }); }}
        />
      </CreatePanel>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No reports filed" /> : filtered.map((r) => (
        <RecordCard
          key={str(r.reportId)}
          title={str(r.title)}
          subtitle={`${str(r.reportType)} report`}
          status={str(r.status)}
          meta={`${str(r.officerBadge)} · ${fmtDate(r.createdAt)}`}
          rows={[{ label: 'Description', value: str(r.description) }, { label: 'Location', value: str(r.location ?? r.district) }]}
          chips={arr(r.suspectNames).map(String)}
        />
      ))}
    </div>
  );
}

function CitationsScreen() {
  const { data, isLoading } = usePoliceCitations();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [violatorName, setViolatorName] = useState('');
  const [violationCode, setViolationCode] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (c) => `${str(c.violatorName)} ${str(c.violationCode)}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Citations & Fines</SectionTitle>
      <CreatePanel label="Issue Citation">
        <Field label="Violator Name" value={violatorName} onChange={setViolatorName} />
        <Field label="Violation Code" value={violationCode} onChange={setViolationCode} placeholder="e.g. TC-101" />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <Field label="Location" value={location} onChange={setLocation} />
        <PrimaryButton
          label={create.citation.isPending ? 'Issuing...' : 'Issue Citation'}
          disabled={!violatorName || !violationCode || !location || create.citation.isPending}
          onClick={() => { tap(); create.citation.mutate({ violatorName, violationCode, description, location }, { onSuccess: () => { setViolatorName(''); setViolationCode(''); setDescription(''); setLocation(''); } }); }}
        />
      </CreatePanel>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No citations issued" /> : filtered.map((c) => (
        <RecordCard
          key={str(c.citationId)}
          title={str(c.violatorName)}
          subtitle={`${str(c.citationType)} · ${str(c.violationCode)}`}
          status={str(c.status)}
          meta={`${str(c.officerBadge)} · ${fmtDate(c.createdAt)}`}
          rows={[
            { label: 'Fine', value: `$${Number(c.fineAmount ?? 0).toLocaleString()}` },
            { label: 'Jail days', value: str(c.jailDays) || '0' },
            { label: 'Location', value: str(c.location) },
          ]}
        />
      ))}
    </div>
  );
}

function CasesScreen() {
  const { data, isLoading } = usePoliceCases();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (c) => `${str(c.title)} ${str(c.caseId)} ${arr(c.suspectNames).join(' ')}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Case Management</SectionTitle>
      <CreatePanel label="Open Case">
        <Field label="Case Title" value={title} onChange={setTitle} />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <PrimaryButton
          label={create.caseFile.isPending ? 'Opening...' : 'Open Case'}
          disabled={!title || !description || create.caseFile.isPending}
          onClick={() => { tap(); create.caseFile.mutate({ title, description }, { onSuccess: () => { setTitle(''); setDescription(''); } }); }}
        />
      </CreatePanel>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No cases" /> : filtered.map((c) => {
        const timeline = arr(c.timeline).map(rec);
        const isOpen = open === str(c.caseId);
        return (
          <RecordCard
            key={str(c.caseId)}
            title={str(c.title)}
            subtitle={str(c.caseId)}
            status={str(c.status)}
            meta={`Lead ${str(c.leadBadge)} · ${fmtDate(c.updatedAt)}`}
            chips={arr(c.charges).map(String)}
            onClick={() => { tap(); setOpen(isOpen ? null : str(c.caseId)); }}
            rows={[{ label: 'Description', value: str(c.description) }, { label: 'Suspects', value: arr(c.suspectNames).join(', ') || '—' }]}
            footer={isOpen && timeline.length > 0 ? (
              <div className="border-t border-white/5 pt-2">
                <p className="text-white/40 text-[10px] uppercase mb-2">Case Timeline</p>
                {timeline.map((t, i) => (
                  <div key={i} className="flex gap-2 py-1">
                    <span className="text-gulf-gold text-xs">•</span>
                    <div>
                      <p className="text-white/80 text-xs">{str(t.event)}</p>
                      <p className="text-white/30 text-[10px]">{fmtDate(t.at)} · {str(t.officerBadge)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : undefined}
          />
        );
      })}
    </div>
  );
}

function EvidenceScreen() {
  const { data, isLoading } = usePoliceEvidence();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('photo');
  const [locker, setLocker] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (e) => `${str(e.title)} ${str(e.evidenceId)} ${str(e.lockerNumber)}`);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Evidence Locker</SectionTitle>
      <CreatePanel label="Log Evidence">
        <Field label="Title" value={title} onChange={setTitle} />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <Segmented options={[['photo', 'Photo'], ['video', 'Video'], ['document', 'Document'], ['physical', 'Physical'], ['digital', 'Digital']]} value={type} onChange={setType} />
        <Field label="Locker Number" value={locker} onChange={setLocker} placeholder="e.g. L-042" />
        <PrimaryButton
          label={create.evidence.isPending ? 'Logging...' : 'Log Evidence'}
          disabled={!title || !description || create.evidence.isPending}
          onClick={() => { tap(); create.evidence.mutate({ title, description, type, lockerNumber: locker }, { onSuccess: () => { setTitle(''); setDescription(''); setLocker(''); } }); }}
        />
      </CreatePanel>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No evidence logged" /> : filtered.map((e) => {
        const custody = arr(e.chainOfCustody).map(rec);
        const isOpen = open === str(e.evidenceId);
        return (
          <RecordCard
            key={str(e.evidenceId)}
            title={str(e.title)}
            subtitle={`${str(e.type)} · Locker ${str(e.lockerNumber) || '—'}`}
            meta={`${str(e.evidenceId)} · Collected by ${str(e.collectedByBadge)}`}
            onClick={() => { tap(); setOpen(isOpen ? null : str(e.evidenceId)); }}
            rows={[{ label: 'Description', value: str(e.description) }, { label: 'Case', value: str(e.caseId) || '—' }]}
            footer={isOpen ? (
              <div className="border-t border-white/5 pt-2">
                <p className="text-white/40 text-[10px] uppercase mb-2">Chain of Custody</p>
                {custody.map((c, i) => (
                  <div key={i} className="flex gap-2 py-1">
                    <span className="text-gulf-gold text-xs">{i + 1}.</span>
                    <div>
                      <p className="text-white/80 text-xs capitalize">{str(c.action)} — {str(c.badge)}</p>
                      <p className="text-white/30 text-[10px]">{fmtDate(c.at)}{c.notes ? ` · ${str(c.notes)}` : ''}</p>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={(ev) => { ev.stopPropagation(); tap(); create.custody.mutate({ id: str(e.evidenceId), body: { action: 'reviewed' } }); }}
                  className="mt-2 w-full py-2 rounded-xl bg-gulf-gold/20 text-gulf-gold text-xs font-semibold"
                >
                  Log Custody: Reviewed
                </button>
              </div>
            ) : undefined}
          />
        );
      })}
    </div>
  );
}

function NotesScreen() {
  const { data, isLoading } = usePoliceNotes();
  const create = usePoliceCreate();
  const { tap } = useHaptic();
  const [content, setContent] = useState('');
  const list = arr(data).map(rec);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Internal Notes</SectionTitle>
      <CreatePanel label="Add Note" defaultOpen>
        <TextArea label="Note" value={content} onChange={setContent} placeholder="Internal note..." />
        <PrimaryButton
          label={create.note.isPending ? 'Saving...' : 'Save Note'}
          disabled={!content || create.note.isPending}
          onClick={() => { tap(); create.note.mutate({ content }, { onSuccess: () => setContent('') }); }}
        />
      </CreatePanel>
      {list.length === 0 ? <EmptyState message="No internal notes" /> : list.map((n) => (
        <GlassCard key={str(n.noteId)} className="p-4">
          <p className="text-white/80 text-sm">{str(n.content)}</p>
          <p className="text-white/30 text-[10px] mt-2">{str(n.officerBadge)} · {fmtDate(n.createdAt)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function PanicsScreen() {
  const { data, isLoading } = usePolicePanics();
  const list = arr(data).map(rec);
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Active Panic Alerts</SectionTitle>
      {list.length === 0 ? <EmptyState message="No active panic alerts" /> : list.map((p) => (
        <RecordCard
          key={str(p.panicId)}
          title={`🚨 ${str(p.callsign ?? p.officerBadge)}`}
          status="panic"
          statusToneOverride="red"
          meta={fmtDate(p.createdAt)}
          rows={[{ label: 'District', value: str(p.district) || '—' }, { label: 'Location', value: p.latitude ? `${str(p.latitude)}, ${str(p.longitude)}` : '—' }]}
        />
      ))}
    </div>
  );
}

function AuditScreen() {
  const { data, isLoading, error } = usePoliceAuditLog();
  const list = arr(data).map(rec);
  const { query, setQuery, filtered } = useFilterSort(list, (l) => `${str(l.action)} ${str(l.officerBadge)} ${str(l.details)}`);
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Audit access denied" />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Audit Log</SectionTitle>
      <FilterBar query={query} onQuery={setQuery} />
      {filtered.length === 0 ? <EmptyState message="No audit records" /> : filtered.map((l) => (
        <GlassCard key={str(l.logId)} className="p-3">
          <div className="flex justify-between">
            <span className="text-white text-xs font-medium capitalize">{str(l.action).replace(/_/g, ' ')}</span>
            <span className="text-white/30 text-[10px]">{fmtDate(l.createdAt)}</span>
          </div>
          <p className="text-white/40 text-[11px] mt-1">{str(l.officerBadge)} · {str(l.details)}{l.ipAddress ? ` · ${str(l.ipAddress)}` : ''}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function AnalyticsScreen() {
  const { data, isLoading } = usePoliceAnalytics();
  if (isLoading) return <LoadingState />;
  const analytics = rec(data);
  const totals = (analytics.totals ?? {}) as Record<string, number>;
  const heatMap = arr(analytics.heatMap) as { district: string; incidents: number }[];
  const crime = (analytics.crimeStats ?? {}) as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <SectionTitle>Statistics</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Dispatches" value={totals.dispatches ?? 0} />
        <StatBox label="Citations" value={totals.citations ?? 0} />
        <StatBox label="Reports" value={totals.reports ?? 0} />
        <StatBox label="Arrests" value={totals.arrests ?? 0} />
      </div>
      <GlassCard className="p-4">
        <div className="flex justify-between"><span className="text-white/50 text-xs">Clearance Rate</span><span className="text-gulf-gold text-sm font-semibold">{str(crime.clearanceRate)}%</span></div>
        <div className="flex justify-between mt-1"><span className="text-white/50 text-xs">Avg Response</span><span className="text-white text-sm">{str(crime.avgResponseTime)}</span></div>
      </GlassCard>
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Heat Map — By District</h3>
        {heatMap.length === 0 ? <p className="text-white/30 text-xs">No data</p> : heatMap.map((h) => (
          <div key={h.district} className="flex justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-white text-sm">{h.district}</span>
            <span className="text-gulf-gold text-sm">{h.incidents}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

const SUB_SCREENS: Record<string, ReactNode> = {
  bolo: <BolosScreen />,
  wanted: <WantedScreen />,
  warrants: <WarrantsScreen />,
  reports: <ReportsScreen />,
  citations: <CitationsScreen />,
  cases: <CasesScreen />,
  evidence: <EvidenceScreen />,
  notes: <NotesScreen />,
  panics: <PanicsScreen />,
  audit: <AuditScreen />,
  analytics: <AnalyticsScreen />,
};

const MORE_ITEMS: [string, string][] = [
  ['bolo', 'BOLO'], ['wanted', 'Wanted'], ['warrants', 'Warrants'],
  ['reports', 'Reports'], ['citations', 'Citations'], ['cases', 'Cases'],
  ['evidence', 'Evidence'], ['notes', 'Notes'], ['panics', 'Panic Alerts'],
  ['audit', 'Audit Log'], ['analytics', 'Analytics'],
];

export function PoliceApp() {
  const [tab, setTab] = useState<Tab>('mdt');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const { tap } = useHaptic();

  usePoliceInit();
  usePoliceSocketSync();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'mdt', label: 'MDT', icon: '📟' },
    { id: 'units', label: 'Units', icon: '👮' },
    { id: 'dispatch', label: 'Dispatch', icon: '📡' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];

  if (subScreen) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
        <button type="button" onClick={() => { tap(); setSubScreen(null); }} className="text-gulf-gold text-sm p-4">‹ MDT</button>
        <div className="flex-1 overflow-y-auto">{SUB_SCREENS[subScreen] ?? <EmptyState message="Section not found" />}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
      <header className="px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚔</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">GULF Police</h1>
            <p className="text-gulf-gold/80 text-[10px] uppercase tracking-widest">Mobile Data Terminal</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'mdt' && <MdtDashboard onNavigate={setSubScreen} />}
            {tab === 'units' && <UnitsScreen />}
            {tab === 'dispatch' && <DispatchScreen />}
            {tab === 'search' && <SearchScreen />}
            {tab === 'more' && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {MORE_ITEMS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { tap(); setSubScreen(id); }}
                    className="py-6 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="border-t border-white/10 bg-black/80 backdrop-blur-lg px-2 py-2 flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { tap(); setTab(t.id); }}
            className={cn('flex-1 flex flex-col items-center py-2 rounded-xl transition-colors', tab === t.id ? 'text-gulf-gold' : 'text-white/40')}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
