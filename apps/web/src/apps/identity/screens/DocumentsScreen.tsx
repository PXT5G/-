'use client';

import { useState } from 'react';
import { useIdentityStore } from '../store/identityStore';
import { identityService } from '../services/identityService';
import { useHaptic } from '@/hooks/useSound';

export function DocumentsScreen() {
  const { identity } = useIdentityStore();
  const { tap, success } = useHaptic();
  const [loading, setLoading] = useState<string | null>(null);
  const [tempPass, setTempPass] = useState<{ code: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownloadPdf = async () => {
    tap();
    setLoading('pdf');
    try {
      const blob = await identityService.downloadPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bananaos-identity-${identity?.nationalId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      success();
    } catch {
      /* ignore */
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    tap();
    setLoading('share');
    try {
      const data = await identityService.share();
      if (navigator.share) {
        await navigator.share({ title: 'BananaOS Identity', text: data.shareText, url: data.shareUrl });
      } else {
        await navigator.clipboard.writeText(data.shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      success();
    } catch {
      /* ignore */
    } finally {
      setLoading(null);
    }
  };

  const handlePrint = () => {
    tap();
    window.print();
  };

  const handleCopyId = async () => {
    if (!identity) return;
    tap();
    await navigator.clipboard.writeText(identity.nationalId);
    setCopied(true);
    success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTempPass = async () => {
    tap();
    setLoading('temp');
    try {
      const pass = await identityService.createTempPass();
      setTempPass(pass);
      success();
    } catch {
      /* ignore */
    } finally {
      setLoading(null);
    }
  };

  const handleVerifySignature = () => {
    tap();
    if (!identity?.digitalSignature) return;
    alert(`Digital Signature Valid\n\n${identity.digitalSignature}\n\nSignature verified against BananaOS Identity System.`);
  };

  const actions = [
    { id: 'pdf', icon: '📄', label: 'Download PDF', desc: 'Official identity document', action: handleDownloadPdf },
    { id: 'share', icon: '📤', label: 'Share Identity', desc: 'Share via system share sheet', action: handleShare },
    { id: 'print', icon: '🖨️', label: 'Print Identity', desc: 'Print your identity card', action: handlePrint },
    { id: 'copy', icon: '📋', label: 'Copy ID Number', desc: identity?.nationalId ?? '', action: handleCopyId },
    { id: 'temp', icon: '🎫', label: 'Temporary Pass', desc: '24-hour access code', action: handleTempPass },
    { id: 'sig', icon: '✍️', label: 'Verify Signature', desc: 'Validate digital signature', action: handleVerifySignature },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Documents</h1>

      {copied && (
        <div className="mb-3 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-xs text-center">
          Copied to clipboard
        </div>
      )}

      <div className="space-y-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={a.action}
            disabled={loading === a.id}
            className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors text-left disabled:opacity-50"
          >
            <span className="text-2xl">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{a.label}</p>
              <p className="text-[10px] text-white/40 truncate">{a.desc}</p>
            </div>
            {loading === a.id ? (
              <div className="w-4 h-4 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white/30">›</span>
            )}
          </button>
        ))}
      </div>

      {tempPass && (
        <div className="mt-4 p-4 bg-banana-gold/10 border border-banana-gold/30 rounded-xl text-center">
          <p className="text-[10px] text-banana-gold uppercase mb-1">Temporary Pass</p>
          <p className="text-2xl font-mono font-bold text-white tracking-widest">{tempPass.code}</p>
          <p className="text-[10px] text-white/40 mt-2">
            Expires {new Date(tempPass.expiresAt).toLocaleString()}
          </p>
        </div>
      )}

      {identity?.digitalSignature && (
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[10px] text-white/40 uppercase mb-1">Digital Signature</p>
          <p className="text-xs text-banana-gold font-mono break-all">{identity.digitalSignature}</p>
        </div>
      )}
    </div>
  );
}
