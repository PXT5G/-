'use client';

import { useState } from 'react';
import { useEnterpriseOrgs, useCreateEnterpriseOrg, useSecuritySocketSync } from '@/hooks/usePhase55';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function EnterpriseApp() {
  const { tap } = useHaptic();
  useSecuritySocketSync();
  const { data: orgs, isLoading } = useEnterpriseOrgs();
  const createOrg = useCreateEnterpriseOrg();
  const [name, setName] = useState('');

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Enterprise</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Glass className="p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2" />
          <button onClick={() => { if (name.trim()) { tap(); createOrg.mutate(name.trim()); setName(''); } }}
            disabled={createOrg.isPending || !name.trim()}
            className="w-full py-2 rounded-xl bg-gulf-gold/20 text-gulf-gold text-sm font-semibold">
            Create Organization
          </button>
        </Glass>
        {isLoading && <p className="text-center text-white/40">Loading...</p>}
        {(orgs as Record<string, unknown>[] ?? []).map((o) => (
          <Glass key={String(o.orgId)} className="p-4">
            <p className="font-semibold">{String(o.name)}</p>
            <p className="text-xs text-white/40">{Array.isArray(o.departments) ? o.departments.length : 0} departments</p>
          </Glass>
        ))}
      </main>
    </div>
  );
}
