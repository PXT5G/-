'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeToAnswerProps {
  onAnswer: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export function SwipeToAnswer({ onAnswer, onReject, disabled }: SwipeToAnswerProps) {
  const x = useMotionValue(0);
  const answerOpacity = useTransform(x, [0, 80], [0.3, 1]);
  const rejectOpacity = useTransform(x, [-80, 0], [1, 0.3]);
  const [done, setDone] = useState(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled || done) return;
    if (info.offset.x > 80) {
      setDone(true);
      onAnswer();
    } else if (info.offset.x < -80) {
      setDone(true);
      onReject();
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto h-16">
      <motion.span style={{ opacity: answerOpacity }} className="absolute left-2 top-1/2 -translate-y-1/2 text-green-400 text-xs">
        Answer
      </motion.span>
      <motion.span style={{ opacity: rejectOpacity }} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 text-xs">
        Decline
      </motion.span>
      <motion.button
        type="button"
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.95 }}
        disabled={disabled || done}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-2xl shadow-lg shadow-green-500/40"
      >
        📞
      </motion.button>
    </div>
  );
}
