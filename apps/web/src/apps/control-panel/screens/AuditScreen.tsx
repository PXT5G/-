'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { controlPanelService } from '../services/controlPanelService';
import { AdminCard } from '../components/AdminCard';
import { Button } from '@/components/shared/Button';

export function AuditScreen() {
  const [search, setSearch] = useState('');
  const [appId, setAppId] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['control-panel', 'audit', search, appId, page],
    queryFn: () => controlPanelService.getAuditLogs({ search: search || undefined, appId: appId || undefined, page }),
    refetchInterval: 30000,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await controlPanelService.exportAudit({ appId: appId || undefined, search: search || undefined });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search action, entity, query..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs" />
        <Button label="Export" onClick={handleExport} loading={exporting} size="sm" />
      </div>
      <input value={appId} onChange={(e) => { setAppId(e.target.value); setPage(0); }} placeholder="Filter app ID..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs mb-3" />

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <p className="text-[10px] text-white/40 mb-2">{data?.total ?? 0} audit entries</p>
          <div className="space-y-2">
            {data?.logs.map((log) => (
              <AdminCard key={log.id} className="py-2 px-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium">{log.action}</p>
                    <p className="text-banana-gold text-[9px]">{log.appId.replace('com.bananaos.', '')} · {log.entityType}</p>
                    {log.query && <p className="text-white/40 text-[9px] truncate">Query: {log.query}</p>}
                  </div>
                  <span className="text-[8px] text-white/30 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </AdminCard>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="text-banana-gold text-xs disabled:opacity-30">← Prev</button>
            <span className="text-white/30 text-xs">Page {page + 1}</span>
            <button type="button" disabled={(data?.logs.length ?? 0) < 50} onClick={() => setPage((p) => p + 1)} className="text-banana-gold text-xs disabled:opacity-30">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
