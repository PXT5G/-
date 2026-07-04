'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

const paymentTypes = [
  { type: 'bill', label: 'Bill Payment', icon: '📄' },
  { type: 'subscription', label: 'Subscription', icon: '🔄' },
  { type: 'store', label: 'Store Purchase', icon: '🛒' },
  { type: 'membership', label: 'Membership', icon: '⭐' },
  { type: 'invoice', label: 'Invoice', icon: '🧾' },
  { type: 'request', label: 'Payment Request', icon: '💸' },
] as const;

export function PaymentsScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('bill');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ['bank', 'accounts'],
    queryFn: () => bankService.getAccounts(),
  });

  const primaryAccount = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];

  const handlePay = async () => {
    if (!primaryAccount) return;
    tap();
    setLoading(true);
    try {
      await bankService.makePayment({
        accountId: primaryAccount.id,
        amount: parseFloat(amount),
        type: selectedType,
        recipient,
        description,
      });
      success();
      setRecipient('');
      setDescription('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    } catch {
      /* handled by api */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Payments</h1>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {paymentTypes.map((p) => (
          <button key={p.type} type="button" onClick={() => setSelectedType(p.type)} className={`p-3 rounded-xl border text-center transition-colors ${selectedType === p.type ? 'bg-banana-gold/20 border-banana-gold/40' : 'bg-white/5 border-white/10'}`}>
            <span className="text-xl">{p.icon}</span>
            <p className="text-[9px] text-white/60 mt-1">{p.label}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (BNA)" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
        <Button label="Make Payment" onClick={handlePay} loading={loading} fullWidth disabled={!recipient || !amount || !description} />
      </div>

      {primaryAccount && (
        <p className="text-[10px] text-white/30 text-center mt-3">Paying from {primaryAccount.alias ?? primaryAccount.type} · {primaryAccount.balance.toFixed(2)} BNA</p>
      )}
    </div>
  );
}
