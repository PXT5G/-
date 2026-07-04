'use client';

import { motion } from 'framer-motion';

interface CallerAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'lg';
  emergency?: boolean;
}

export function CallerAvatar({ name, avatar, size = 'lg', emergency }: CallerAvatarProps) {
  const dim = size === 'lg' ? 'w-28 h-28 text-4xl' : 'w-14 h-14 text-xl';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${dim} rounded-full flex items-center justify-center overflow-hidden border-2 ${
        emergency ? 'border-red-400 shadow-lg shadow-red-500/30' : 'border-white/20'
      } bg-gradient-to-br from-white/10 to-white/5`}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold">{initials || '?'}</span>
      )}
    </motion.div>
  );
}
