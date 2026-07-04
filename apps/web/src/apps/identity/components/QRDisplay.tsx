'use client';

import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';

interface QRDisplayProps {
  value: string;
  size?: number;
  animated?: boolean;
}

export function QRDisplay({ value, size = 120, animated = true }: QRDisplayProps) {
  return (
    <motion.div
      className="bg-white p-2 rounded-xl shadow-lg shadow-banana-gold/10"
      animate={animated ? { scale: [1, 1.02, 1] } : undefined}
      transition={animated ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <QRCode value={value} size={size} level="H" fgColor="#0A0A0A" bgColor="#FFFFFF" />
    </motion.div>
  );
}
