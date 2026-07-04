'use client';

import { motion } from 'framer-motion';
import type { IdentityData } from '../types';
import { QRDisplay } from './QRDisplay';
import { BarcodeDisplay } from './BarcodeDisplay';

interface IdentityCardProps {
  identity: IdentityData;
  flipped: boolean;
  onFlip: () => void;
}

const levelColors: Record<string, string> = {
  standard: 'from-white/10 to-white/5',
  silver: 'from-gray-400/20 to-gray-300/10',
  gold: 'from-banana-gold/30 to-banana-gold/10',
  platinum: 'from-purple-400/20 to-banana-gold/20',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status, verified }: { status: string; verified: boolean }) {
  const color =
    status === 'verified' && verified
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : status === 'pending'
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        : status === 'suspended'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-white/10 text-white/60 border-white/20';

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      {verified ? '✓ Verified' : status.toUpperCase()}
    </span>
  );
}

export function IdentityCard({ identity, flipped, onFlip }: IdentityCardProps) {
  const gradient = levelColors[identity.membershipLevel] ?? levelColors.standard;

  return (
    <div className="perspective-[1000px] w-full max-w-[340px] mx-auto" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 25 }}
        onClick={onFlip}
      >
        {/* Front */}
        <div
          className="w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/50"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`bg-gradient-to-br ${gradient} backdrop-blur-2xl bg-black/60 p-5`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-banana-gold font-semibold tracking-widest uppercase">BananaOS</p>
                <p className="text-xs text-white/50">Digital Identity</p>
              </div>
              <StatusBadge status={identity.status} verified={identity.verified} />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-banana-gold/40 to-banana-gold/10 border-2 border-banana-gold/50 flex items-center justify-center text-2xl overflow-hidden">
                {identity.photo ? (
                  <img src={identity.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  identity.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg truncate">{identity.fullName}</h2>
                <p className="text-banana-gold text-sm">@{identity.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ['ID Number', identity.nationalId],
                ['Membership', identity.membershipNumber],
                ['Level', identity.membershipLevel.toUpperCase()],
                ['Country', identity.country],
                ['Issued', formatDate(identity.issueDate)],
                ['Expires', formatDate(identity.expiryDate)],
              ].map(([label, value]) => (
                <div key={label} className="bg-white/5 rounded-lg px-2 py-1.5">
                  <p className="text-[9px] text-white/40 uppercase">{label}</p>
                  <p className="text-[11px] text-white font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <QRDisplay value={identity.qrPayload} size={72} />
              <div className="flex-1 ml-3">
                <BarcodeDisplay value={identity.barcodeValue} />
                <p className="text-[9px] text-white/30 text-center mt-1">Tap to flip</p>
              </div>
            </div>

            {identity.digitalSignature && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-[8px] text-white/30 uppercase mb-0.5">Digital Signature</p>
                <p className="text-[9px] text-banana-gold/70 font-mono truncate">{identity.digitalSignature}</p>
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-2xl p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-banana-gold text-xs font-semibold tracking-widest">CARD BACK</p>
              <span className="text-2xl">🍌</span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-white/5 rounded-lg p-2.5">
                <p className="text-[9px] text-white/40 uppercase mb-1">Emergency Contact</p>
                {identity.emergencyContact ? (
                  <>
                    <p className="text-sm text-white">{identity.emergencyContact.name}</p>
                    <p className="text-xs text-banana-gold">{identity.emergencyContact.phone}</p>
                    <p className="text-[10px] text-white/50">{identity.emergencyContact.relationship}</p>
                  </>
                ) : (
                  <p className="text-xs text-white/40">Not set</p>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-2.5">
                <p className="text-[9px] text-white/40 uppercase mb-1">Additional Information</p>
                <p className="text-xs text-white/70">{identity.additionalInfo ?? '—'}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-2.5">
                <p className="text-[9px] text-white/40 uppercase mb-1">Profile Status</p>
                <p className="text-sm text-white capitalize">{identity.profileStatus}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-2.5">
                <p className="text-[9px] text-white/40 uppercase mb-1">Badges</p>
                <div className="flex flex-wrap gap-1">
                  {identity.badges.map((b) => (
                    <span key={b} className="px-1.5 py-0.5 bg-banana-gold/20 text-banana-gold text-[10px] rounded">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-2 border-t border-white/10">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-2 border-banana-gold/50 flex items-center justify-center text-xl mb-1">
                  🍌
                </div>
                <p className="text-[9px] text-banana-gold tracking-widest">BANANAOS SEAL</p>
                <p className="text-[8px] text-white/30">Official Verified Identity</p>
              </div>
            </div>

            <p className="text-[9px] text-white/30 text-center mt-3">Tap to flip back</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
