'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import { Button } from '@/components/shared/Button';

type MdtTab = 'persons' | 'vehicles' | 'properties' | 'cases' | 'audit';

const TABS: { id: MdtTab; label: string }[] = [
  { id: 'persons', label: 'Persons' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'properties', label: 'Properties' },
  { id: 'cases', label: 'Cases' },
  { id: 'audit', label: 'Audit' },
];

export function MDTScreen() {
  const [tab, setTab] = useState<MdtTab>('persons');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: auditLogs } = useQuery({
    queryKey: ['police', 'audit'],
    queryFn: () => policeService.getAuditLogs(30),
    enabled: tab === 'audit',
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      if (tab === 'persons') {
        const r = await policeService.mdtSearchPersons(query);
        setResults([...r.identities, ...r.contacts]);
      } else if (tab === 'vehicles') {
        setResults(await policeService.mdtSearchVehicles(query));
      } else if (tab === 'properties') {
        setResults(await policeService.mdtSearchProperties(query));
      } else if (tab === 'cases') {
        setResults(await policeService.mdtCaseLookup(query));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-2">Mobile Data Terminal</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setResults(null); setError(null); }}
              className={`px-3 py-1 rounded-full text-[10px] whitespace-nowrap ${tab === t.id ? 'bg-banana-gold/20 text-banana-gold border border-banana-gold/30' : 'bg-white/5 text-white/50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'audit' && (
        <div className="px-4 py-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${tab}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
          />
          <Button label="Search" onClick={handleSearch} loading={searching} size="sm" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        {tab === 'audit' && auditLogs && (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <GlassCard key={log.id}>
                <p className="text-white text-xs font-medium">{log.action}</p>
                {log.query && <p className="text-banana-gold text-[10px]">Query: {log.query}</p>}
                <p className="text-white/40 text-[10px]">{new Date(log.createdAt).toLocaleString()}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {results && results.length === 0 && <p className="text-white/40 text-sm text-center py-8">No results found</p>}

        {results && results.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard className="mb-2">
              <pre className="text-white/80 text-[11px] whitespace-pre-wrap font-sans">
                {JSON.stringify(item, null, 2).replace(/[{}"]/g, '').trim()}
              </pre>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
