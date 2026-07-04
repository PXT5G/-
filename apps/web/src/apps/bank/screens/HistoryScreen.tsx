'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { TransactionItem } from '../components/TransactionItem';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function HistoryScreen() {
  const { tap } = useHaptic();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['bank', 'transactions', filter, search],
    queryFn: () => bankService.getTransactions({
      direction: filter === 'income' || filter === 'expense' ? filter : undefined,
      status: filter === 'pending' || filter === 'completed' || filter === 'failed' ? filter : undefined,
      q: search.length >= 2 ? search : undefined,
    }),
  });

  const handleExportCsv = async () => {
    tap();
    setExporting(true);
    try {
      const blob = await bankService.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'banana-bank-transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const filters = ['all', 'income', 'expense', 'pending', 'completed', 'failed'];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white font-bold text-lg">History</h1>
        <Button label="Export CSV" onClick={handleExportCsv} loading={exporting} size="sm" variant="secondary" />
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 mb-3" />

      <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
        {filters.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize ${filter === f ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/50'}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : transactions?.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-8">No transactions found</p>
      ) : (
        transactions?.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
      )}
    </div>
  );
}
