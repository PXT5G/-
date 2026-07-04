'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { identityService } from '../services/identityService';
import { useIdentityStore } from '../store/identityStore';
import { QRDisplay } from '../components/QRDisplay';
import { BarcodeDisplay } from '../components/BarcodeDisplay';
import { Button } from '@/components/shared/Button';
import type { VerifyResult } from '../types';
import { useHaptic } from '@/hooks/useSound';

export function VerificationScreen() {
  const { identity } = useIdentityStore();
  const { tap, success, error: hapticError } = useHaptic();
  const [mode, setMode] = useState<'generate' | 'verify'>('generate');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyMethod, setVerifyMethod] = useState<'qr' | 'barcode' | 'api'>('qr');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: history } = useQuery({
    queryKey: ['identity', 'verification-history'],
    queryFn: () => identityService.getVerificationHistory(),
  });

  const handleVerify = async () => {
    tap();
    setLoading(true);
    setResult(null);
    try {
      let res: VerifyResult;
      if (verifyMethod === 'barcode') {
        res = await identityService.verify({ barcode: verifyInput, method: 'barcode' });
      } else if (verifyMethod === 'api') {
        res = await identityService.verify({ nationalId: verifyInput, method: 'api' });
      } else {
        res = await identityService.verify({ payload: verifyInput, method: 'qr' });
      }
      setResult(res);
      if (res.result === 'success') success();
      else hapticError();
    } catch {
      setResult({ result: 'failed', message: 'Verification failed' });
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  const resultColors: Record<string, string> = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    failed: 'border-red-500/30 bg-red-500/10 text-red-400',
    expired: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    suspended: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Verification</h1>

      <div className="flex gap-2 mb-4">
        {(['generate', 'verify'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { tap(); setMode(m); setResult(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === m ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {m === 'generate' ? 'Generate' : 'Verify'}
          </button>
        ))}
      </div>

      {mode === 'generate' && identity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-[10px] text-white/40 uppercase mb-3">QR Code</p>
            <div className="flex justify-center mb-3">
              <QRDisplay value={identity.qrPayload} size={160} />
            </div>
            <p className="text-[10px] text-white/30 font-mono break-all px-2">{identity.qrPayload.slice(0, 60)}...</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] text-white/40 uppercase mb-2 text-center">Barcode</p>
            <BarcodeDisplay value={identity.barcodeValue} />
          </div>

          <div className="bg-banana-gold/10 border border-banana-gold/20 rounded-xl p-3">
            <p className="text-banana-gold text-xs font-semibold">Verification API</p>
            <p className="text-white/50 text-[10px] mt-1">
              POST /api/identity/verify with payload, barcode, or nationalId. Other BananaOS apps use this endpoint.
            </p>
          </div>
        </motion.div>
      )}

      {mode === 'verify' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex gap-1">
            {(['qr', 'barcode', 'api'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setVerifyMethod(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs ${
                  verifyMethod === m ? 'bg-white/20 text-white' : 'text-white/40'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder={
              verifyMethod === 'qr'
                ? 'Paste QR payload JSON...'
                : verifyMethod === 'barcode'
                  ? 'Enter barcode value...'
                  : 'Enter National ID (BN-YYYY-XXXXXX)...'
            }
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-banana-gold/50 resize-none font-mono"
          />

          <Button label="Verify Identity" onClick={handleVerify} loading={loading} fullWidth />

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl p-4 border ${resultColors[result.result]}`}
              >
                <p className="font-semibold text-sm capitalize">{result.result}</p>
                <p className="text-xs mt-1 opacity-80">{result.message}</p>
                {result.identity && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-sm font-medium">{result.identity.fullName}</p>
                    <p className="text-xs opacity-70">{result.identity.nationalId}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {history && history.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-white font-medium mb-2">Verification History</p>
          <div className="space-y-1">
            {history.slice(0, 8).map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <p className="text-xs text-white capitalize">{h.method} · {h.result}</p>
                  {h.verifiedByApp && <p className="text-[10px] text-white/40">{h.verifiedByApp}</p>}
                </div>
                <p className="text-[10px] text-white/30">{new Date(h.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
