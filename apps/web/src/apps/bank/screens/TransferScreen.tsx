'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { Button } from '@/components/shared/Button';
import { QRDisplay } from '@/apps/identity/components/QRDisplay';
import { useHaptic } from '@/hooks/useSound';

export function TransferScreen() {
  const { tap, success, error: hapticError } = useHaptic();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'send' | 'qr_generate' | 'qr_scan'>('send');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ payload: string; dataUrl: string } | null>(null);
  const [scanPayload, setScanPayload] = useState('');

  const { data: accounts } = useQuery({
    queryKey: ['bank', 'accounts'],
    queryFn: () => bankService.getAccounts(),
  });

  const primaryAccount = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const effectiveFrom = fromAccountId || primaryAccount?.id || '';

  const handleTransfer = async () => {
    tap();
    setLoading(true);
    setResult(null);
    try {
      const res = await bankService.transfer({
        fromAccountId: effectiveFrom,
        toAccountNumber,
        amount: parseFloat(amount),
        reason,
      });
      success();
      setResult(res.requiresApproval ? `Pending approval — Ref: ${res.reference}` : `Transfer complete — Ref: ${res.reference}`);
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    } catch (err) {
      hapticError();
      setResult(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    tap();
    setLoading(true);
    try {
      const qr = await bankService.generateQr(effectiveFrom, amount ? parseFloat(amount) : undefined);
      setQrData(qr);
      success();
    } catch {
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  const handleScanQr = async () => {
    tap();
    setLoading(true);
    try {
      const res = await bankService.scanQr(scanPayload, effectiveFrom);
      success();
      setResult(`QR Payment complete — Ref: ${res.reference}`);
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    } catch (err) {
      hapticError();
      setResult(err instanceof Error ? err.message : 'QR payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Transfers</h1>

      <div className="flex gap-1 mb-4">
        {(['send', 'qr_generate', 'qr_scan'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-2 rounded-xl text-xs font-medium ${mode === m ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/60'}`}>
            {m === 'send' ? 'Send' : m === 'qr_generate' ? 'Get QR' : 'Scan QR'}
          </button>
        ))}
      </div>

      {accounts && (
        <select value={effectiveFrom} onChange={(e) => setFromAccountId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mb-3">
          {accounts.map((a) => (
            <option key={a.id} value={a.id} className="bg-black">{a.alias ?? a.type} — {a.balance.toFixed(2)} BNA</option>
          ))}
        </select>
      )}

      {mode === 'send' && (
        <div className="space-y-3">
          <input value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)} placeholder="Recipient account number (BNK-...)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (BNA)" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
          <Button label="Send Money" onClick={handleTransfer} loading={loading} fullWidth />
        </div>
      )}

      {mode === 'qr_generate' && (
        <div className="space-y-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (optional — leave blank for any)" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20" />
          <Button label="Generate Payment QR" onClick={handleGenerateQr} loading={loading} fullWidth />
          {qrData && (
            <div className="flex flex-col items-center mt-4 bg-white/5 rounded-2xl p-4 border border-white/10">
              <QRDisplay value={qrData.payload} size={160} />
              <p className="text-[10px] text-white/40 mt-2 text-center">Scan to pay{amount ? ` ${amount} BNA` : ''}</p>
            </div>
          )}
        </div>
      )}

      {mode === 'qr_scan' && (
        <div className="space-y-3">
          <textarea value={scanPayload} onChange={(e) => setScanPayload(e.target.value)} placeholder="Paste payment QR payload..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 font-mono resize-none" />
          <Button label="Pay via QR" onClick={handleScanQr} loading={loading} fullWidth />
        </div>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm text-center ${result.includes('complete') || result.includes('Pending') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {result}
        </div>
      )}
    </div>
  );
}
