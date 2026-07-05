'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useIdentityInit, useIdentitySocketSync, useIdentityProfile,
  useIdentityDocuments, useIdentityEmergency, useGenerateQr, useExportVCard,
} from '@/hooks/useIdentity';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'profile' | 'documents' | 'emergency' | 'verify';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
  { id: 'verify', label: 'Verify', icon: '✅' },
];

const DOC_ICONS: Record<string, string> = {
  national_id: '🪪', passport: '📕', driving_license: '🚗', residency_permit: '🏠',
  vehicle_ownership: '🚙', property_ownership: '🏢', business_ownership: '💼',
  medical_card: '🏥', insurance: '🛡️', police_badge: '🚔', justice_credential: '⚖️',
};

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full" />
    </div>
  );
}

function ProfileTab() {
  const { data, isLoading } = useIdentityProfile();
  const exportVCard = useExportVCard();
  const { tap } = useHaptic();
  if (isLoading) return <LoadingState />;
  if (!data) return null;
  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gulf-gold/20 border-2 border-gulf-gold mx-auto flex items-center justify-center text-3xl mb-3">
          {data.photoUrl ? <img src={data.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : '🪪'}
        </div>
        <h2 className="text-xl font-bold text-white">{data.fullName}</h2>
        <p className="text-sm text-white/50 font-mono">{data.nationalId}</p>
        <span className={cn('inline-block mt-2 text-xs px-3 py-1 rounded-full',
          data.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400')}>
          {data.status}
        </span>
      </GlassCard>
      <GlassCard className="p-4 space-y-2">
        {[
          ['Nationality', data.nationality],
          ['Role', data.role],
          data.phone && ['Phone', data.phone],
          data.email && ['Email', data.email],
          data.address && ['Address', `${data.address}${data.city ? `, ${data.city}` : ''}`],
        ].filter(Boolean).map((row) => (
          <div key={row![0] as string} className="flex justify-between text-sm">
            <span className="text-white/50">{row![0] as string}</span>
            <span className="text-white">{row![1] as string}</span>
          </div>
        ))}
      </GlassCard>
      <button onClick={() => { tap(); exportVCard.mutate(); }}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10">
        Export vCard
      </button>
    </div>
  );
}

function DocumentsTab() {
  const { data, isLoading } = useIdentityDocuments();
  if (isLoading) return <LoadingState />;
  return (
    <div className="space-y-3 p-4">
      {(data ?? []).length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No documents</p>
      ) : (data ?? []).map((d) => (
        <GlassCard key={d.documentId} className="p-4 flex items-center gap-3">
          <span className="text-2xl">{DOC_ICONS[d.documentType] ?? '📄'}</span>
          <div className="flex-1">
            <p className="font-semibold text-white">{d.title}</p>
            <p className="text-xs text-white/40 font-mono">{d.documentNumber}</p>
            <p className="text-[10px] text-white/30 capitalize">{d.documentType.replace(/_/g, ' ')}</p>
          </div>
          {d.isVerified && <span className="text-green-400 text-xs">✓</span>}
        </GlassCard>
      ))}
    </div>
  );
}

function EmergencyTab() {
  const { data, isLoading } = useIdentityEmergency();
  if (isLoading) return <LoadingState />;
  const info = data as { bloodType?: string; allergies?: string[]; medications?: string[]; emergencyContacts?: { name: string; phone: string; relationship: string }[]; medicalNotes?: string } | undefined;
  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold text-red-400 mb-3">Medical Information</h3>
        {info?.bloodType && <p className="text-sm text-white">Blood Type: <span className="text-gulf-gold">{info.bloodType}</span></p>}
        {info?.allergies && info.allergies.length > 0 && (
          <p className="text-sm text-white mt-2">Allergies: {info.allergies.join(', ')}</p>
        )}
        {info?.medications && info.medications.length > 0 && (
          <p className="text-sm text-white mt-2">Medications: {info.medications.join(', ')}</p>
        )}
        {info?.medicalNotes && <p className="text-xs text-white/50 mt-2">{info.medicalNotes}</p>}
      </GlassCard>
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold text-white/70 mb-3">Emergency Contacts</h3>
        {(info?.emergencyContacts ?? []).length === 0 ? (
          <p className="text-xs text-white/40">No emergency contacts configured</p>
        ) : (info?.emergencyContacts ?? []).map((c, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm text-white">{c.name}</p>
              <p className="text-[10px] text-white/40">{c.relationship}</p>
            </div>
            <p className="text-sm text-gulf-gold">{c.phone}</p>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function VerifyTab() {
  const generateQr = useGenerateQr();
  const { tap } = useHaptic();
  const [qrData, setQrData] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = () => {
    tap();
    generateQr.mutate(undefined, {
      onSuccess: (data) => setQrData(data as Record<string, unknown>),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-white/60 mb-4">Generate a QR code for identity verification</p>
        <button onClick={handleGenerate} disabled={generateQr.isPending}
          className="px-6 py-3 rounded-xl bg-gulf-gold text-black font-semibold text-sm disabled:opacity-50">
          {generateQr.isPending ? 'Generating...' : 'Generate QR Code'}
        </button>
        {qrData && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
            <div className="w-32 h-32 mx-auto bg-white rounded-xl flex items-center justify-center">
              <span className="text-4xl">📱</span>
            </div>
            <p className="text-xs text-white/40 mt-2 font-mono break-all">{String(qrData.qrCode ?? '').slice(0, 32)}...</p>
            <p className="text-sm text-white mt-1">{String(qrData.fullName)}</p>
          </motion.div>
        )}
      </GlassCard>
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold text-white/70 mb-2">Verification Methods</h3>
        <div className="grid grid-cols-2 gap-2">
          {['QR Code', 'Barcode', 'NFC', 'Biometric'].map((m) => (
            <div key={m} className="p-3 rounded-xl bg-white/5 text-center text-xs text-white/60">{m}</div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function IdentityApp() {
  const [tab, setTab] = useState<Tab>('profile');
  const { tap } = useHaptic();
  useIdentityInit();
  useIdentitySocketSync();

  const renderTab = () => {
    switch (tab) {
      case 'profile': return <ProfileTab />;
      case 'documents': return <DocumentsTab />;
      case 'emergency': return <EmergencyTab />;
      case 'verify': return <VerifyTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Digital Identity</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="flex border-t border-white/10 bg-black/30 backdrop-blur-md">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { tap(); setTab(t.id); }}
            className={cn('flex-1 py-2 flex flex-col items-center gap-0.5 text-[10px]',
              tab === t.id ? 'text-gulf-gold' : 'text-white/40')}>
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
