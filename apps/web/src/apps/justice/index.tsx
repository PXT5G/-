'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useJusticeDashboard, useJusticeCases, useJusticeHearings, useJusticeTrials,
  useJusticeWarrants, useJusticeAppeals, useJusticeContestedCitations,
  useJusticeOfficials, useJusticeCourtrooms, useJusticeLaws, useJusticeDocket,
  useJusticeAnalytics, useUpdateJusticeStatus, useJusticeSearch,
  useReviewWarrant, useResolveCitation, useJusticeSocketSync, useJusticeInit,
  useJusticeSentences, useJusticeNotes, useJusticeDocuments, useJusticeAuditLog, useJusticeCreate,
} from '@/hooks/useJustice';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';
import {
  RecordCard, SectionTitle, PrimaryButton, Field, TextArea, Segmented,
  CreatePanel, EmptyState as GovEmpty, StructuredResults,
} from '@/apps/gov-shared/GovKit';

function jrec(item: unknown) { return item as Record<string, unknown>; }
function jstr(v: unknown) { return v === undefined || v === null ? '' : String(v); }
function jarr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }
function jdate(v: unknown) { return v ? new Date(String(v)).toLocaleString() : ''; }

type Tab = 'mdt' | 'docket' | 'cases' | 'hearings' | 'search' | 'more';
type SubScreen = string | null;

const STATUS_COLORS: Record<string, string> = {
  on_duty: 'bg-green-500', off_duty: 'bg-gray-500', in_court: 'bg-amber-500',
  in_chambers: 'bg-blue-500', unavailable: 'bg-red-500',
};

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <GlassCard className={cn('p-3 text-center', alert && value > 0 && 'border-amber-500/50')}>
      <p className={cn('text-2xl font-bold', alert && value > 0 ? 'text-amber-400' : 'text-gulf-gold')}>{value}</p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function MdtDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { data, isLoading, error } = useJusticeDashboard();
  const updateStatus = useUpdateJusticeStatus();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load judicial MDT" />;

  const official = data.official as Record<string, string>;
  const stats = data.stats;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gulf-gold text-xs font-semibold uppercase tracking-wider">Court Official</p>
            <p className="text-white text-lg font-bold">{official.displayName ?? 'Official'}</p>
            <p className="text-white/50 text-sm">{official.employeeId} · {official.title}</p>
          </div>
          <div className="text-right">
            <span className={cn('inline-block w-3 h-3 rounded-full mr-1', STATUS_COLORS[official.status] ?? 'bg-gray-500')} />
            <span className="text-white/70 text-sm capitalize">{official.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {['on_duty', 'in_court', 'off_duty'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { tap(); updateStatus.mutate(s); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors',
                official.status === s ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Active Cases" value={stats.activeCases} />
        <StatBox label="Hearings" value={stats.pendingHearings} />
        <StatBox label="Warrants" value={stats.pendingWarrants} alert />
        <StatBox label="Appeals" value={stats.pendingAppeals} />
        <StatBox label="Citations" value={stats.contestedCitations} alert />
        <StatBox label="Dockets" value={stats.todayDockets} />
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['warrants', 'Warrants'], ['citations', 'Citations'], ['appeals', 'Appeals'],
            ['laws', 'Laws'], ['officials', 'Staff'], ['analytics', 'Analytics'],
            ['trials', 'Trials'], ['courtrooms', 'Courtrooms'],
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

      {(data.upcomingHearings as Record<string, unknown>[]).length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-white/60 text-xs uppercase mb-3">Upcoming Hearings</h3>
          {(data.upcomingHearings as Record<string, unknown>[]).map((h) => (
            <div key={String(h.hearingId)} className="py-2 border-b border-white/5 last:border-0">
              <div className="flex justify-between">
                <span className="text-white text-sm">{String(h.title)}</span>
                <span className="text-amber-400 text-xs">{String(h.caseNumber)}</span>
              </div>
              <p className="text-white/40 text-xs">{String(h.courtroomId)} · {new Date(String(h.scheduledAt)).toLocaleString()}</p>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

function DocketScreen() {
  const { data, isLoading } = useJusticeDocket();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No docket entries published" />;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Court Docket</h2>
      {(data as Record<string, unknown>[]).map((d) => (
        <GlassCard key={String(d.docketId)} className="p-4">
          <div className="flex justify-between mb-2">
            <p className="text-gulf-gold font-semibold">{String(d.courtroomId)}</p>
            <span className="text-white/50 text-xs">{new Date(String(d.date)).toLocaleDateString()}</span>
          </div>
          {((d.entries as Record<string, unknown>[]) ?? []).map((e, i) => (
            <div key={i} className="py-2 border-b border-white/5 last:border-0 flex justify-between">
              <div>
                <p className="text-white text-sm">{String(e.title)}</p>
                <p className="text-white/40 text-xs">{String(e.caseNumber)}</p>
              </div>
              <span className="text-gulf-gold text-xs">{String(e.time)}</span>
            </div>
          ))}
        </GlassCard>
      ))}
    </div>
  );
}

function CasesScreen() {
  const { data, isLoading } = useJusticeCases();
  const create = useJusticeCreate();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [defendantName, setDefendantName] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  const filtered = list;

  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Court Cases</SectionTitle>
      <CreatePanel label="Open Case">
        <Field label="Case Title" value={title} onChange={setTitle} />
        <Field label="Defendant" value={defendantName} onChange={setDefendantName} />
        <TextArea label="Description" value={description} onChange={setDescription} />
        <PrimaryButton
          label={create.caseFile.isPending ? 'Opening...' : 'Open Case'}
          disabled={!title || !defendantName || create.caseFile.isPending}
          onClick={() => { tap(); create.caseFile.mutate({ title, defendantName, description }, { onSuccess: () => { setTitle(''); setDefendantName(''); setDescription(''); } }); }}
        />
      </CreatePanel>
      {filtered.length === 0 ? <GovEmpty message="No cases on file" /> : filtered.map((c) => {
        const timeline = jarr(c.timeline).map(jrec);
        const isOpen = open === jstr(c.caseId);
        return (
          <RecordCard
            key={jstr(c.caseId)}
            title={jstr(c.title)}
            subtitle={jstr(c.caseNumber)}
            status={jstr(c.status)}
            meta={`Defendant: ${jstr(c.defendantName)}${c.policeCaseId ? ` · Police ${jstr(c.policeCaseId)}` : ''}`}
            onClick={() => { tap(); setOpen(isOpen ? null : jstr(c.caseId)); }}
            footer={isOpen && timeline.length > 0 ? (
              <div className="border-t border-white/5 pt-2">
                <p className="text-white/40 text-[10px] uppercase mb-2">Case Timeline</p>
                {timeline.map((t, i) => (
                  <div key={i} className="flex gap-2 py-1">
                    <span className="text-gulf-gold text-xs">•</span>
                    <div>
                      <p className="text-white/80 text-xs">{jstr(t.event ?? t.description)}</p>
                      <p className="text-white/30 text-[10px]">{jdate(t.at ?? t.date)}</p>
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

function HearingsScreen() {
  const { data, isLoading } = useJusticeHearings();
  const create = useJusticeCreate();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [hearingType, setHearingType] = useState('arraignment');
  const [scheduledAt, setScheduledAt] = useState('');
  if (isLoading) return <LoadingState />;

  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Hearings</SectionTitle>
      <CreatePanel label="Schedule Hearing">
        <Field label="Title" value={title} onChange={setTitle} />
        <Field label="Case Number" value={caseNumber} onChange={setCaseNumber} />
        <Segmented options={[['arraignment', 'Arraignment'], ['pretrial', 'Pretrial'], ['motion', 'Motion'], ['sentencing', 'Sentencing'], ['bail', 'Bail']]} value={hearingType} onChange={setHearingType} />
        <Field label="Scheduled At" value={scheduledAt} onChange={setScheduledAt} type="datetime-local" />
        <PrimaryButton
          label={create.hearing.isPending ? 'Scheduling...' : 'Schedule Hearing'}
          disabled={!title || !caseNumber || !scheduledAt || create.hearing.isPending}
          onClick={() => { tap(); create.hearing.mutate({ title, caseNumber, hearingType, scheduledAt: new Date(scheduledAt).toISOString() }, { onSuccess: () => { setTitle(''); setCaseNumber(''); setScheduledAt(''); } }); }}
        />
      </CreatePanel>
      {!data?.length ? <GovEmpty message="No hearings scheduled" /> : (data as Record<string, unknown>[]).map((h) => (
        <GlassCard key={String(h.hearingId)} className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-white font-medium text-sm">{String(h.title)}</span>
            <span className="text-amber-400 text-xs capitalize">{String(h.hearingType)}</span>
          </div>
          <p className="text-white/50 text-xs">{String(h.caseNumber)} · {String(h.courtroomId)}</p>
          <p className="text-white/40 text-xs mt-1">{new Date(String(h.scheduledAt)).toLocaleString()}</p>
          <span className={cn('inline-block mt-2 text-xs px-2 py-0.5 rounded-full capitalize',
            h.status === 'in_progress' ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-white/60'
          )}>
            {String(h.status)}
          </span>
        </GlassCard>
      ))}
    </div>
  );
}

function SearchScreen() {
  const [searchType, setSearchType] = useState('citizen');
  const [query, setQuery] = useState('');
  const search = useJusticeSearch();
  const { tap } = useHaptic();

  const types = [
    ['citizen', 'Citizen'], ['identity', 'Identity'], ['phone', 'Phone'],
    ['vehicle', 'Vehicle'], ['property', 'Property'], ['business', 'Business'],
    ['weapon', 'Weapon'], ['case', 'Case #'], ['evidence', 'Evidence'],
    ['report', 'Reports'], ['bank', 'Bank'],
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Judicial Search</h2>
      <div className="flex flex-wrap gap-2">
        {types.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSearchType(id)}
            className={cn('px-3 py-1.5 rounded-full text-xs', searchType === id ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white')}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter search query..."
        className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm"
      />
      <button
        type="button"
        disabled={!query || search.isPending}
        onClick={() => { tap(); search.mutate({ searchType, query }); }}
        className="w-full py-3 bg-gulf-gold text-black rounded-xl font-semibold disabled:opacity-50"
      >
        {search.isPending ? 'Searching...' : 'Search'}
      </button>
      {search.data !== undefined && <StructuredResults results={(search.data as Record<string, unknown>).results} type={searchType} />}
      {search.isError && <ErrorState message="Search failed or permission denied" />}
    </div>
  );
}

function WarrantsScreen() {
  const { data, isLoading } = useJusticeWarrants('pending');
  const review = useReviewWarrant();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No warrants pending review" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Warrant Reviews</h2>
      {(data as Record<string, unknown>[]).map((w) => (
        <GlassCard key={String(w.warrantReviewId)} className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-white font-medium text-sm">{String(w.subjectName)}</span>
            <span className="text-amber-400 text-xs capitalize">{String(w.warrantType)}</span>
          </div>
          <p className="text-white/50 text-xs mb-2">{String(w.description)}</p>
          <p className="text-white/40 text-xs">Requested by: {String(w.requestedByBadge)}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { tap(); review.mutate({ warrantReviewId: String(w.warrantReviewId), approved: true }); }}
              className="flex-1 py-2 rounded-xl bg-green-600/80 text-white text-xs font-semibold"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { tap(); review.mutate({ warrantReviewId: String(w.warrantReviewId), approved: false, denialReason: 'Insufficient probable cause' }); }}
              className="flex-1 py-2 rounded-xl bg-red-600/80 text-white text-xs font-semibold"
            >
              Deny
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function CitationsScreen() {
  const { data, isLoading } = useJusticeContestedCitations();
  const resolve = useResolveCitation();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No contested citations" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Contested Citations</h2>
      {(data as Record<string, unknown>[]).map((c) => (
        <GlassCard key={String(c.citationId)} className="p-4">
          <p className="text-white font-medium text-sm">{String(c.violatorName)}</p>
          <p className="text-white/50 text-xs">{String(c.violationCode)} — ${String(c.fineAmount)}</p>
          <p className="text-white/40 text-xs mt-1">{String(c.description)}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { tap(); resolve.mutate({ citationId: String(c.citationId), resolution: 'upheld' }); }}
              className="flex-1 py-2 rounded-xl bg-amber-600/80 text-white text-xs font-semibold"
            >
              Uphold
            </button>
            <button
              type="button"
              onClick={() => { tap(); resolve.mutate({ citationId: String(c.citationId), resolution: 'dismissed' }); }}
              className="flex-1 py-2 rounded-xl bg-green-600/80 text-white text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function AppealsScreen() {
  const { data, isLoading } = useJusticeAppeals();
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  if (!list.length) return <GovEmpty message="No appeals filed" />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Appeals</SectionTitle>
      {list.map((a) => (
        <RecordCard
          key={jstr(a.appealId)}
          title={jstr(a.caseNumber ?? a.appealId)}
          subtitle={jstr(a.grounds ?? a.reason)}
          status={jstr(a.status)}
          meta={`Filed by ${jstr(a.filedByName ?? a.appellant)} · ${jdate(a.createdAt)}`}
          rows={[{ label: 'Decision', value: jstr(a.decision) || 'Pending' }]}
        />
      ))}
    </div>
  );
}

function TrialsScreen() {
  const { data, isLoading } = useJusticeTrials();
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  if (!list.length) return <GovEmpty message="No trials on record" />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Trials & Verdicts</SectionTitle>
      {list.map((t) => (
        <RecordCard
          key={jstr(t.trialId)}
          title={jstr(t.caseNumber ?? t.title)}
          subtitle={jstr(t.defendantName)}
          status={jstr(t.verdict ?? t.status)}
          meta={`${jstr(t.courtroomId)} · ${jdate(t.scheduledAt ?? t.createdAt)}`}
          rows={[
            { label: 'Judge', value: jstr(t.judgeEmployeeId) },
            { label: 'Verdict', value: jstr(t.verdict) || 'Pending' },
          ]}
        />
      ))}
    </div>
  );
}

function SentencesScreen() {
  const { data, isLoading } = useJusticeSentences();
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  if (!list.length) return <GovEmpty message="No sentences issued" />;
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Sentencing</SectionTitle>
      {list.map((s) => (
        <RecordCard
          key={jstr(s.sentenceId)}
          title={jstr(s.defendantName ?? s.caseNumber)}
          subtitle={jstr(s.type ?? s.sentenceType)}
          status={jstr(s.status)}
          meta={`${jstr(s.judgeEmployeeId)} · ${jdate(s.createdAt)}`}
          rows={[
            { label: 'Prison days', value: jstr(s.prisonDays) || '0' },
            { label: 'Fine', value: s.fineAmount ? `$${Number(s.fineAmount).toLocaleString()}` : '—' },
            { label: 'Details', value: jstr(s.description ?? s.notes) },
          ]}
        />
      ))}
    </div>
  );
}

function DocumentsScreen() {
  const { data, isLoading } = useJusticeDocuments();
  const create = useJusticeCreate();
  const { tap } = useHaptic();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('order');
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Judicial Documents</SectionTitle>
      <CreatePanel label="File Document">
        <Field label="Title" value={title} onChange={setTitle} />
        <Segmented options={[['order', 'Order'], ['ruling', 'Ruling'], ['motion', 'Motion'], ['brief', 'Brief'], ['notice', 'Notice']]} value={type} onChange={setType} />
        <TextArea label="Content" value={content} onChange={setContent} />
        <PrimaryButton
          label={create.document.isPending ? 'Filing...' : 'File Document'}
          disabled={!title || !content || create.document.isPending}
          onClick={() => { tap(); create.document.mutate({ title, type, content }, { onSuccess: () => { setTitle(''); setContent(''); } }); }}
        />
      </CreatePanel>
      {list.length === 0 ? <GovEmpty message="No documents filed" /> : list.map((d) => (
        <RecordCard
          key={jstr(d.documentId)}
          title={jstr(d.title)}
          subtitle={jstr(d.type)}
          status={jstr(d.status)}
          meta={`${jstr(d.filedByName)} · ${jdate(d.createdAt)}`}
          rows={[{ label: 'Case', value: jstr(d.caseId) || '—' }, { label: 'Content', value: jstr(d.content) }]}
        />
      ))}
    </div>
  );
}

function NotesScreen() {
  const { data, isLoading } = useJusticeNotes();
  const create = useJusticeCreate();
  const { tap } = useHaptic();
  const [content, setContent] = useState('');
  if (isLoading) return <LoadingState />;
  const list = jarr(data).map(jrec);
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Legal Notes</SectionTitle>
      <CreatePanel label="Add Note" defaultOpen>
        <TextArea label="Note" value={content} onChange={setContent} />
        <PrimaryButton
          label={create.note.isPending ? 'Saving...' : 'Save Note'}
          disabled={!content || create.note.isPending}
          onClick={() => { tap(); create.note.mutate({ content }, { onSuccess: () => setContent('') }); }}
        />
      </CreatePanel>
      {list.length === 0 ? <GovEmpty message="No legal notes" /> : list.map((n) => (
        <GlassCard key={jstr(n.noteId)} className="p-4">
          <p className="text-white/80 text-sm">{jstr(n.content)}</p>
          <p className="text-white/30 text-[10px] mt-2">{jstr(n.officialName)} · {jdate(n.createdAt)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function AuditScreen() {
  const { data, isLoading, error } = useJusticeAuditLog();
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Audit access denied" />;
  const list = jarr(data).map(jrec);
  return (
    <div className="p-4 space-y-3">
      <SectionTitle>Audit Log</SectionTitle>
      {list.length === 0 ? <GovEmpty message="No audit records" /> : list.map((l) => (
        <GlassCard key={jstr(l.logId)} className="p-3">
          <div className="flex justify-between">
            <span className="text-white text-xs font-medium capitalize">{jstr(l.action).replace(/_/g, ' ')}</span>
            <span className="text-white/30 text-[10px]">{jdate(l.createdAt)}</span>
          </div>
          <p className="text-white/40 text-[11px] mt-1">{jstr(l.employeeId)} · {jstr(l.details)}{l.ipAddress ? ` · ${jstr(l.ipAddress)}` : ''}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function AnalyticsScreen() {
  const { data, isLoading } = useJusticeAnalytics();
  if (isLoading) return <LoadingState />;
  const analytics = data as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Court Analytics</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Total Cases" value={Number(analytics.totalCases ?? 0)} />
        <StatBox label="Active" value={Number(analytics.activeCases ?? 0)} />
        <StatBox label="Closed" value={Number(analytics.closedCases ?? 0)} />
        <StatBox label="Hearings" value={Number(analytics.hearings ?? 0)} />
        <StatBox label="Trials" value={Number(analytics.trials ?? 0)} />
        <StatBox label="Sentences" value={Number(analytics.sentences ?? 0)} />
        <StatBox label="Appeals" value={Number(analytics.appeals ?? 0)} />
        <StatBox label="Warrants OK" value={Number(analytics.warrantsApproved ?? 0)} />
      </div>
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Cases by Status</h3>
        {((analytics.casesByStatus as { _id: string; count: number }[]) ?? []).map((s) => (
          <div key={s._id} className="flex justify-between py-2 border-b border-white/5">
            <span className="text-white text-sm capitalize">{s._id}</span>
            <span className="text-gulf-gold text-sm">{s.count}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function OfficialsScreen() {
  const { data, isLoading } = useJusticeOfficials();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No court officials registered" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Court Staff</h2>
      {(data as Record<string, unknown>[]).map((o) => (
        <GlassCard key={String(o.employeeId)} className="p-3 flex justify-between items-center">
          <div>
            <p className="text-white text-sm">{String(o.displayName ?? o.employeeId)}</p>
            <p className="text-white/40 text-xs">{String(o.employeeId)} · {String(o.title)}</p>
          </div>
          <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[String(o.status)] ?? 'bg-gray-500')} />
        </GlassCard>
      ))}
    </div>
  );
}

function CourtroomsScreen() {
  const { data, isLoading } = useJusticeCourtrooms();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No courtrooms configured" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Courtrooms</h2>
      {(data as Record<string, unknown>[]).map((r) => (
        <GlassCard key={String(r.courtroomId)} className="p-4">
          <div className="flex justify-between">
            <p className="text-gulf-gold font-semibold">{String(r.name)}</p>
            <span className="text-white/50 text-xs capitalize">{String(r.status)}</span>
          </div>
          <p className="text-white/40 text-xs mt-1">Floor {String(r.floor)} · Capacity {String(r.capacity)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function LawsScreen() {
  const { data, isLoading } = useJusticeLaws();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No laws in statute database" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Statute Database</h2>
      {(data as Record<string, unknown>[]).map((l) => (
        <GlassCard key={String(l.lawId)} className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-gulf-gold font-semibold text-sm">{String(l.statute)}</span>
            <span className="text-white/50 text-xs capitalize">{String(l.severity)}</span>
          </div>
          <p className="text-white text-sm">{String(l.title)}</p>
          <p className="text-white/40 text-xs mt-1">{String(l.description)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-red-400 text-center py-12 text-sm">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-white/40 text-center py-12 text-sm">{message}</p>;
}

export function JusticeApp() {
  const [tab, setTab] = useState<Tab>('mdt');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const { tap } = useHaptic();

  useJusticeInit();
  useJusticeSocketSync();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'mdt', label: 'MDT', icon: '⚖️' },
    { id: 'docket', label: 'Docket', icon: '📋' },
    { id: 'cases', label: 'Cases', icon: '📁' },
    { id: 'hearings', label: 'Hearings', icon: '🏛️' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];

  if (subScreen) {
    const screens: Record<string, ReactNode> = {
      warrants: <WarrantsScreen />,
      citations: <CitationsScreen />,
      appeals: <AppealsScreen />,
      laws: <LawsScreen />,
      officials: <OfficialsScreen />,
      analytics: <AnalyticsScreen />,
      trials: <TrialsScreen />,
      courtrooms: <CourtroomsScreen />,
      sentences: <SentencesScreen />,
      documents: <DocumentsScreen />,
      notes: <NotesScreen />,
      audit: <AuditScreen />,
    };
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
        <button type="button" onClick={() => { tap(); setSubScreen(null); }} className="text-gulf-gold text-sm p-4">‹ MDT</button>
        <div className="flex-1 overflow-y-auto">{screens[subScreen] ?? <EmptyState message="Section not found" />}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
      <header className="px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">GULF Justice</h1>
            <p className="text-gulf-gold/80 text-[10px] uppercase tracking-widest">Judicial MDT</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'mdt' && <MdtDashboard onNavigate={setSubScreen} />}
            {tab === 'docket' && <DocketScreen />}
            {tab === 'cases' && <CasesScreen />}
            {tab === 'hearings' && <HearingsScreen />}
            {tab === 'search' && <SearchScreen />}
            {tab === 'more' && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  ['warrants', 'Warrants'], ['citations', 'Citations'], ['appeals', 'Appeals'],
                  ['trials', 'Trials'], ['sentences', 'Sentencing'], ['documents', 'Documents'],
                  ['notes', 'Legal Notes'], ['laws', 'Laws'], ['officials', 'Staff'],
                  ['courtrooms', 'Courtrooms'], ['audit', 'Audit Log'], ['analytics', 'Analytics'],
                ].map(([id, label]) => (
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
            className={cn(
              'flex-1 flex flex-col items-center py-2 rounded-xl transition-colors',
              tab === t.id ? 'text-gulf-gold' : 'text-white/40'
            )}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
