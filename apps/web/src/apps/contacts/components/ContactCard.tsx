'use client';

import { motion } from 'framer-motion';
import { ContactAvatar } from './ContactAvatar';
import type { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onFavorite?: () => void;
  showActions?: boolean;
}

export function ContactCard({ contact, onClick, onFavorite, showActions }: ContactCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors text-left"
    >
      <ContactAvatar contact={contact} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm font-medium truncate">{contact.fullName}</p>
          {contact.isFavorite && <span className="text-[10px]">⭐</span>}
          {contact.isEmergency && <span className="text-[10px]">🆘</span>}
          {contact.isBlocked && <span className="text-[10px]">🚫</span>}
        </div>
        <p className="text-white/40 text-xs truncate">{contact.primaryPhone ?? contact.phoneNumbers[0]?.number}</p>
        {contact.organizationName && <p className="text-white/30 text-[10px] truncate">{contact.organizationName}</p>}
      </div>
      {showActions && onFavorite && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="text-lg p-1"
        >
          {contact.isFavorite ? '⭐' : '☆'}
        </button>
      )}
    </motion.button>
  );
}
