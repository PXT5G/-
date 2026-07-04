'use client';

import { useQuery } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import type { BankAccount } from '../types';

const typeIcons: Record<string, string> = {
  current: '💳',
  savings: '🏦',
  business: '🏢',
  wallet: '👛',
};

export function AccountsScreen() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bank', 'accounts'],
    queryFn: () => bankService.getAccounts(),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Accounts</h1>
      <div className="space-y-3">
        {accounts?.map((account: BankAccount) => (
          <div key={account.id} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeIcons[account.type] ?? '💳'}</span>
                <div>
                  <p className="text-white font-medium">{account.alias ?? account.type}</p>
                  <p className="text-[10px] text-white/40 capitalize">{account.type} account</p>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${account.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {account.status}
              </span>
            </div>
            <p className="text-2xl font-bold text-banana-gold mb-2">{account.balance.toFixed(2)} <span className="text-sm text-white/50">BNA</span></p>
            <div className="space-y-1">
              <p className="text-[10px] text-white/40 font-mono">{account.accountNumber}</p>
              <p className="text-[10px] text-white/30 font-mono">{account.iban}</p>
            </div>
            {account.isPrimary && <span className="inline-block mt-2 text-[9px] text-banana-gold bg-banana-gold/10 px-2 py-0.5 rounded-full">Primary</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
