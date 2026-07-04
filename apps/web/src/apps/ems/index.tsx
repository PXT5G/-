'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useEmsDashboard, useEmsUnits, useEmsDispatches, useEmsPatients,
  useEmsHospitals, useEmsAmbulances, useEmsIncidents, useEmsPersonnel,
  useEmsAnalytics, useUpdateEmsStatus, useEmsSearch, useAssignAmbulance,
  useRouteHospital, useHelicopterDispatch, useEmsSocketSync, useEmsInit,
} from '@/hooks/useEms';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'mdt' | 'units' | 'dispatch' | 'patients' | 'search' | 'more';
type SubScreen = string | null;

const STATUS_COLORS: Record<string, string> = {
  on_duty: 'bg-green-500', off_duty: 'bg-gray-500', en_route: 'bg-blue-500',
  on_scene: 'bg-red-500', at_hospital: 'bg-purple-500', unavailable: 'bg-gray-600',
};

const UNIT_COLORS: Record<string, string> = {
  available: 'bg-green-500', dispatched: 'bg-amber-500', en_route: 'bg-blue-500',
  on_scene: 'bg-red-500', transporting: 'bg-purple-500', at_hospital: 'bg-indigo-500', offline: 'bg-gray-500',
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
    <GlassCard className={cn('p-3 text-center', alert && value > 0 && 'border-red-500/50')}>
      <p className={cn('text-2xl font-bold', alert && value > 0 ? 'text-red-400' : 'text-gulf-gold')}>{value}</p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function MdtDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { data, isLoading, error } = useEmsDashboard();
  const updateStatus = useUpdateEmsStatus();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load EMS MDT" />;

  const personnel = data.personnel as Record<string, string>;
  const stats = data.stats;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gulf-gold text-xs font-semibold uppercase tracking-wider">EMS Personnel</p>
            <p className="text-white text-lg font-bold">{personnel.displayName ?? 'Medic'}</p>
            <p className="text-white/50 text-sm">{personnel.badgeNumber} · {personnel.title}</p>
          </div>
          <div className="text-right">
            <span className={cn('inline-block w-3 h-3 rounded-full mr-1', STATUS_COLORS[personnel.status] ?? 'bg-gray-500')} />
            <span className="text-white/70 text-sm capitalize">{personnel.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {['on_duty', 'en_route', 'off_duty'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { tap(); updateStatus.mutate(s); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors',
                personnel.status === s ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="911 Medical" value={stats.calls911} alert />
        <StatBox label="Active" value={stats.activeDispatches} />
        <StatBox label="On Duty" value={stats.onDutyPersonnel} />
        <StatBox label="Units" value={stats.availableUnits} />
        <StatBox label="Critical" value={stats.criticalPatients} alert />
        <StatBox label="Incidents" value={stats.activeIncidents} alert />
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Hospital Capacity</h3>
        {(data.hospitalCapacity as Record<string, unknown>[] ?? []).map((h) => (
          <div key={String(h.hospitalId)} className="py-2 border-b border-white/5 last:border-0">
            <div className="flex justify-between">
              <span className="text-white text-sm">{String(h.name)}</span>
              <span className={cn('text-xs', Number(h.occupancyRate) > 80 ? 'text-red-400' : 'text-green-400')}>
                {String(h.availableBeds)}/{String(h.totalBeds)} beds
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', Number(h.occupancyRate) > 80 ? 'bg-red-500' : 'bg-green-500')}
                style={{ width: `${Number(h.occupancyRate)}%` }}
              />
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['hospitals', 'Hospitals'], ['ambulances', 'Ambulances'], ['incidents', 'Incidents'],
            ['personnel', 'Staff'], ['analytics', 'Analytics'],
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
    </div>
  );
}

function UnitsScreen() {
  const { data: units, isLoading: uLoad } = useEmsUnits();
  const { data: ambulances, isLoading: aLoad } = useEmsAmbulances();
  if (uLoad || aLoad) return <LoadingState />;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Live Units</h2>
      {(units as Record<string, unknown>[] ?? []).map((u) => (
        <GlassCard key={String(u.unitId)} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gulf-gold font-semibold">{String(u.code)}</p>
              <p className="text-white text-sm">{String(u.name)}</p>
            </div>
            <span className={cn('w-2.5 h-2.5 rounded-full', UNIT_COLORS[String(u.status)] ?? 'bg-gray-500')} />
          </div>
          <p className="text-white/40 text-xs mt-1">
            {String(u.radioChannel ?? '')} · {u.latitude ? `${Number(u.latitude).toFixed(4)}, ${Number(u.longitude).toFixed(4)}` : 'No GPS'}
            {u.etaMinutes ? ` · ETA ${String(u.etaMinutes)}m` : ''}
          </p>
        </GlassCard>
      ))}
      <h3 className="text-white/60 text-sm uppercase mt-4">Ambulances</h3>
      {(ambulances as Record<string, unknown>[] ?? []).map((a) => (
        <GlassCard key={String(a.ambulanceId)} className="p-3 flex justify-between items-center">
          <div>
            <p className="text-white text-sm">{String(a.callSign)}</p>
            <p className="text-white/40 text-xs">{String(a.plateNumber)} · {String(a.type)}</p>
          </div>
          <span className="text-white/50 text-xs capitalize">{String(a.status)}</span>
        </GlassCard>
      ))}
    </div>
  );
}

function DispatchScreen() {
  const { data: all, isLoading } = useEmsDispatches();
  const { data: calls911 } = useEmsDispatches(true);
  const assign = useAssignAmbulance();
  const route = useRouteHospital();
  const helicopter = useHelicopterDispatch();
  const { data: units } = useEmsUnits();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">EMS Dispatch</h2>
      {(calls911 as Record<string, unknown>[] ?? []).length > 0 && (
        <>
          <p className="text-red-400 text-xs font-bold uppercase">911 Medical Calls</p>
          {(calls911 as Record<string, unknown>[]).map((d) => (
            <DispatchCard
              key={String(d.dispatchId)}
              dispatch={d}
              units={units as Record<string, unknown>[] ?? []}
              onAssign={(unitId) => { tap(); assign.mutate({ dispatchId: String(d.dispatchId), unitId }); }}
              onRoute={() => { tap(); route.mutate({ dispatchId: String(d.dispatchId) }); }}
              onHelicopter={() => { tap(); helicopter.mutate(String(d.dispatchId)); }}
            />
          ))}
        </>
      )}
      <p className="text-white/60 text-xs uppercase">Active Dispatches</p>
      {(all as Record<string, unknown>[] ?? []).filter((d) => d.status !== 'resolved').map((d) => (
        <DispatchCard
          key={String(d.dispatchId)}
          dispatch={d}
          units={units as Record<string, unknown>[] ?? []}
          onAssign={(unitId) => { tap(); assign.mutate({ dispatchId: String(d.dispatchId), unitId }); }}
          onRoute={() => { tap(); route.mutate({ dispatchId: String(d.dispatchId) }); }}
          onHelicopter={() => { tap(); helicopter.mutate(String(d.dispatchId)); }}
        />
      ))}
      {(all as Record<string, unknown>[] ?? []).length === 0 && <EmptyState message="No active dispatches" />}
    </div>
  );
}

function DispatchCard({
  dispatch: d, units, onAssign, onRoute, onHelicopter,
}: {
  dispatch: Record<string, unknown>;
  units: Record<string, unknown>[];
  onAssign: (unitId: string) => void;
  onRoute: () => void;
  onHelicopter: () => void;
}) {
  const priority = Number(d.priority);
  const availableUnits = units.filter((u) => u.status === 'available');
  return (
    <GlassCard className={cn('p-4', priority === 1 && 'border-red-500/40')}>
      <div className="flex justify-between mb-2">
        <span className="text-white font-medium text-sm">{String(d.title)}</span>
        <div className="flex gap-1">
          {Boolean(d.is911) && <span className="text-red-400 text-xs font-bold">911</span>}
          {Boolean(d.isMassCasualty) && <span className="text-amber-400 text-xs font-bold">MCI</span>}
          <span className={cn('text-xs px-2 py-0.5 rounded-full', priority === 1 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/60')}>
            P{priority}
          </span>
        </div>
      </div>
      <p className="text-white/50 text-xs mb-1">{String(d.description)}</p>
      <p className="text-white/40 text-xs">{String(d.address ?? d.district ?? '')}</p>
      {Boolean(d.patientName) && <p className="text-white/40 text-xs mt-1">Patient: {String(d.patientName)}</p>}
      {Boolean(d.etaMinutes) && <p className="text-gulf-gold text-xs mt-1">ETA: {String(d.etaMinutes)} min</p>}
      {Boolean(d.destinationHospitalId) && <p className="text-white/30 text-xs">→ {String(d.destinationHospitalId)}</p>}
      {d.status === 'pending' && availableUnits.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {availableUnits.slice(0, 3).map((u) => (
            <button
              key={String(u.unitId)}
              type="button"
              onClick={() => onAssign(String(u.unitId))}
              className="px-3 py-1.5 rounded-xl bg-gulf-gold/20 text-gulf-gold text-xs font-semibold"
            >
              {String(u.code)}
            </button>
          ))}
        </div>
      )}
      {d.status === 'assigned' && (
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={onRoute} className="flex-1 py-2 rounded-xl bg-blue-600/80 text-white text-xs font-semibold">
            Route Hospital
          </button>
          <button type="button" onClick={onHelicopter} className="flex-1 py-2 rounded-xl bg-purple-600/80 text-white text-xs font-semibold">
            Air Med
          </button>
        </div>
      )}
    </GlassCard>
  );
}

function PatientsScreen() {
  const { data, isLoading } = useEmsPatients();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No patients on file" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Patients</h2>
      {(data as Record<string, unknown>[]).map((p) => (
        <GlassCard key={String(p.patientId)} className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-white font-medium text-sm">{String(p.name)}</span>
            <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full',
              p.status === 'critical' ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/60'
            )}>
              {String(p.status)}
            </span>
          </div>
          <p className="text-white/40 text-xs">Blood: {String(p.bloodType)} · ID: {String(p.patientId)}</p>
          {(p.allergies as string[])?.length > 0 && (
            <p className="text-amber-400 text-xs mt-1">⚠ Allergies: {(p.allergies as string[]).join(', ')}</p>
          )}
          {Boolean(p.emergencyContactName) && (
            <p className="text-white/30 text-xs mt-1">EC: {String(p.emergencyContactName)} {String(p.emergencyContactPhone ?? '')}</p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function SearchScreen() {
  const [searchType, setSearchType] = useState('citizen');
  const [query, setQuery] = useState('');
  const search = useEmsSearch();
  const { tap } = useHaptic();

  const types = [
    ['citizen', 'Citizen'], ['identity', 'Identity'], ['phone', 'Phone'],
    ['record', 'Medical Record'], ['blood_type', 'Blood Type'],
    ['emergency_contact', 'Emergency Contact'], ['insurance', 'Insurance'],
    ['allergies', 'Allergies'], ['treatments', 'Treatments'],
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Patient Search</h2>
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
      {search.data && (
        <GlassCard className="p-4">
          <pre className="text-white/80 text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {JSON.stringify((search.data as Record<string, unknown>).results, null, 2)}
          </pre>
        </GlassCard>
      )}
      {search.isError && <ErrorState message="Search failed or permission denied" />}
    </div>
  );
}

function HospitalsScreen() {
  const { data, isLoading } = useEmsHospitals();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message="No hospitals configured" />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Hospitals</h2>
      {(data as Record<string, unknown>[]).map((h) => (
        <GlassCard key={String(h.hospitalId)} className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-gulf-gold font-semibold text-sm">{String(h.name)}</span>
            <span className={cn('text-xs capitalize', h.status === 'open' ? 'text-green-400' : 'text-red-400')}>
              {String(h.status)}
            </span>
          </div>
          <p className="text-white/50 text-xs">{String(h.address)} · {String(h.district)}</p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><p className="text-white text-sm font-bold">{String(h.availableBeds)}</p><p className="text-white/40 text-[10px]">Beds</p></div>
            <div><p className="text-white text-sm font-bold">{String(Number(h.erCapacity) - Number(h.erOccupied))}</p><p className="text-white/40 text-[10px]">ER Open</p></div>
            <div><p className="text-white text-sm font-bold">L{String(h.traumaLevel)}</p><p className="text-white/40 text-[10px]">Trauma</p></div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function AnalyticsScreen() {
  const { data, isLoading } = useEmsAnalytics();
  if (isLoading) return <LoadingState />;
  const analytics = data as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">EMS Analytics</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Dispatches" value={Number(analytics.dispatches ?? 0)} />
        <StatBox label="Patients" value={Number(analytics.patients ?? 0)} />
        <StatBox label="Treatments" value={Number(analytics.treatments ?? 0)} />
        <StatBox label="Admissions" value={Number(analytics.admissions ?? 0)} />
        <StatBox label="Incidents" value={Number(analytics.incidents ?? 0)} />
      </div>
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">By District</h3>
        {((analytics.dispatchesByDistrict as { _id: string; count: number }[]) ?? []).map((d) => (
          <div key={d._id} className="flex justify-between py-2 border-b border-white/5">
            <span className="text-white text-sm">{d._id}</span>
            <span className="text-gulf-gold text-sm">{d.count}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function ListScreen({ title, useHook }: { title: string; useHook: () => { data?: unknown[]; isLoading: boolean } }) {
  const { data, isLoading } = useHook();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message={`No ${title.toLowerCase()} records`} />;
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      {data.map((item, i) => (
        <GlassCard key={i} className="p-4">
          <pre className="text-white/80 text-xs whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
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

export function EmsApp() {
  const [tab, setTab] = useState<Tab>('mdt');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const { tap } = useHaptic();

  useEmsInit();
  useEmsSocketSync();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'mdt', label: 'MDT', icon: '🚑' },
    { id: 'units', label: 'Units', icon: '📡' },
    { id: 'dispatch', label: 'Dispatch', icon: '📞' },
    { id: 'patients', label: 'Patients', icon: '🏥' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];

  if (subScreen) {
    const screens: Record<string, ReactNode> = {
      hospitals: <HospitalsScreen />,
      ambulances: <ListScreen title="Ambulances" useHook={useEmsAmbulances} />,
      incidents: <ListScreen title="Incidents" useHook={useEmsIncidents} />,
      personnel: <ListScreen title="EMS Staff" useHook={useEmsPersonnel} />,
      analytics: <AnalyticsScreen />,
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
          <span className="text-2xl">🚑</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">GULF EMS</h1>
            <p className="text-gulf-gold/80 text-[10px] uppercase tracking-widest">Emergency Medical Services</p>
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
            {tab === 'units' && <UnitsScreen />}
            {tab === 'dispatch' && <DispatchScreen />}
            {tab === 'patients' && <PatientsScreen />}
            {tab === 'search' && <SearchScreen />}
            {tab === 'more' && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  ['hospitals', 'Hospitals'], ['ambulances', 'Ambulances'], ['incidents', 'Incidents'],
                  ['personnel', 'Staff'], ['analytics', 'Analytics'],
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
