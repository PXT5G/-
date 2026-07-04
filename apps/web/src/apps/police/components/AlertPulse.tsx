'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePoliceStore } from '../store/policeStore';

export function AlertPulse() {
  const alerts = usePoliceStore((s) => s.alerts);
  const dismissAlert = usePoliceStore((s) => s.dismissAlert);
  const top = alerts[0];

  return (
    <AnimatePresence>
      {top && (
        <motion.div
          key={top.id}
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-2 left-4 right-4 z-50"
        >
          <button
            type="button"
            onClick={() => dismissAlert(top.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-2xl border shadow-lg ${
              top.priority === 'critical' || top.priority === 'high'
                ? 'bg-red-500/20 border-red-400/40'
                : 'bg-black/80 border-banana-gold/30'
            }`}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-lg"
            >
              🚨
            </motion.span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-xs font-semibold truncate">{top.title}</p>
              <p className="text-white/50 text-[10px] truncate">{top.body}</p>
            </div>
            <span className="text-white/30 text-[10px]">tap to dismiss</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
