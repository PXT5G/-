'use client';

import { motion } from 'framer-motion';
import type { Contact } from '../types';

interface ContactAvatarProps {
  contact: Pick<Contact, 'fullName' | 'avatar' | 'type'>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export function ContactAvatar({ contact, size = 'md' }: ContactAvatarProps) {
  const initials = contact.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const typeColor = contact.type === 'emergency' ? 'from-red-500/30 to-red-900/30 border-red-500/30' :
    contact.type === 'business' ? 'from-blue-500/20 to-blue-900/20 border-blue-500/30' :
    'from-banana-gold/20 to-banana-gold/5 border-banana-gold/20';

  if (contact.avatar) {
    return <img src={contact.avatar} alt={contact.fullName} className={`${SIZE[size]} rounded-full object-cover border ${typeColor}`} />;
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={`${SIZE[size]} rounded-full bg-gradient-to-br ${typeColor} border flex items-center justify-center font-semibold text-banana-gold`}
    >
      {initials}
    </motion.div>
  );
}
