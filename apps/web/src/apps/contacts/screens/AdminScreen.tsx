'use client';

import { useQuery } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';

export function AdminScreen() {
  const { data: stats } = useQuery({
    queryKey: ['contacts', 'admin', 'stats'],
    queryFn: () => contactsService.getAdminStats(),
  });

  const { data: audit = [] } = useQuery({
    queryKey: ['contacts', 'admin', 'audit'],
    queryFn: () => contactsService.getAdminAudit(),
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-3">Admin Panel</p>

      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-[9px] text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-white text-lg font-medium">{value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">System Audit Log</p>
      <div className="space-y-2">
        {audit.slice(0, 20).map((log) => (
          <div key={log.id} className="bg-white/5 rounded-lg p-2 border border-white/10">
            <div className="flex justify-between">
              <p className="text-white text-xs font-medium">{log.action}</p>
              <p className="text-white/30 text-[9px]">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
            <p className="text-white/40 text-[10px]">{log.entityType} · {log.permission}</p>
            {log.newValue && <p className="text-white/50 text-[10px] truncate">{log.newValue}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
