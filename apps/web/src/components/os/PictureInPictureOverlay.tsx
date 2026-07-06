'use client';

import { motion } from 'framer-motion';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useHaptic } from '@/hooks/useSound';

export function PictureInPictureOverlay() {
  const pipWindow = usePhoneOsStore((s) => s.pipWindow);
  const setPipWindow = usePhoneOsStore((s) => s.setPipWindow);
  const { tap } = useHaptic();

  if (!pipWindow) return null;

  return (
    <motion.div
      data-testid="gulfos-pip-window"
      className="absolute bottom-24 right-4 z-[70] w-36 h-24 rounded-2xl overflow-hidden border-2 border-gulf-gold/60 shadow-2xl bg-black/90 backdrop-blur-md"
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      drag
      dragConstraints={{ left: 0, right: 200, top: -400, bottom: 0 }}
    >
      <div className="h-full flex flex-col items-center justify-center p-2">
        <span className="text-2xl">{pipWindow.icon}</span>
        <p className="text-[10px] text-white text-center mt-1">{pipWindow.title}</p>
        <button
          type="button"
          className="mt-1 text-[9px] text-gulf-gold"
          onClick={() => { tap(); setPipWindow(null); }}
        >
          Close PiP
        </button>
      </div>
    </motion.div>
  );
}
