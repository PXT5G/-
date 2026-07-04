'use client';

import { motion } from 'framer-motion';
import type { BankCard as BankCardType } from '../types';

const cardStyles: Record<string, string> = {
  debit: 'from-blue-900/80 via-blue-800/60 to-black/80',
  credit: 'from-purple-900/80 via-purple-800/60 to-black/80',
  premium_black: 'from-zinc-900 via-black to-zinc-950',
};

interface BankCardVisualProps {
  card: BankCardType;
  flipped?: boolean;
  onFlip?: () => void;
}

export function BankCardVisual({ card, flipped, onFlip }: BankCardVisualProps) {
  const gradient = cardStyles[card.type] ?? cardStyles.debit;
  const isPremium = card.type === 'premium_black';

  return (
    <div className="w-full max-w-[320px] mx-auto" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-[190px] cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 25 }}
        onClick={onFlip}
      >
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} border ${isPremium ? 'border-banana-gold/40' : 'border-white/15'} p-5 shadow-2xl backdrop-blur-xl overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-banana-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-banana-gold/80 tracking-widest uppercase">Banana Bank</p>
              <p className="text-white/50 text-[9px] capitalize">{card.type.replace('_', ' ')}</p>
            </div>
            {card.frozen && <span className="text-[9px] bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">FROZEN</span>}
            {isPremium && <span className="text-banana-gold text-lg">✦</span>}
          </div>
          <p className="text-white font-mono text-lg tracking-[0.2em] mb-4">{card.cardNumber}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] text-white/40 uppercase">Card Holder</p>
              <p className="text-white text-sm">{card.holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/40 uppercase">Expires</p>
              <p className="text-white text-sm">{String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-black/90 to-zinc-900 border border-white/10 p-5`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="w-full h-10 bg-zinc-800 rounded mt-2" />
            <div className="bg-white/90 rounded px-3 py-1.5 w-3/4 ml-auto">
              <p className="text-black font-mono text-sm text-right">***</p>
            </div>
            <p className="text-[9px] text-white/30 text-center">Tap to flip · CVV on file</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
