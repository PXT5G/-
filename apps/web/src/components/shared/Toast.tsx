'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useToastStore } from '@/stores/toastStore';

const variantStyles = {
  success: 'bg-banana-gold/90 text-black border-banana-gold',
  error: 'bg-red-500/90 text-white border-red-400',
  info: 'bg-white/10 text-white border-white/20',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed top-14 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={reducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-medium border shadow-lg backdrop-blur-xl ${variantStyles[t.variant]}`}
          >
            <button type="button" onClick={() => dismiss(t.id)} className="w-full text-left">
              {t.message}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
