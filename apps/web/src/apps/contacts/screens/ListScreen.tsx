'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { contactsService } from '../services/contactsService';
import { useContactsStore } from '../store/contactsStore';
import { ContactCard } from '../components/ContactCard';
import { ContactAvatar } from '../components/ContactAvatar';
import { Button } from '@/components/shared/Button';
import type { Contact } from '../types';

export function ListScreen() {
  const { searchQuery, setSearchQuery, selectedContact, setSelectedContact } = useContactsStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', phone: '', email: '', type: 'personal' as const });
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'list', searchQuery],
    queryFn: () => searchQuery ? contactsService.search(searchQuery) : contactsService.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => contactsService.create({
      firstName: newContact.firstName,
      lastName: newContact.lastName || undefined,
      email: newContact.email || undefined,
      type: newContact.type,
      phoneNumbers: [{ number: newContact.phone, label: 'mobile', primary: true }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowAdd(false);
      setNewContact({ firstName: '', lastName: '', phone: '', email: '', type: 'personal' });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => contactsService.toggleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.remove(id),
    onSuccess: () => {
      setSelectedContact(null);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  if (selectedContact) {
    return <ContactDetail contact={selectedContact} onBack={() => setSelectedContact(null)} onDelete={() => deleteMutation.mutate(selectedContact.id)} onFavorite={() => favoriteMutation.mutate(selectedContact.id)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5">
        <input
          type="search"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-banana-gold/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : contacts.length === 0 ? (
          <p className="text-center text-white/40 text-sm py-8">No contacts found</p>
        ) : (
          contacts.map((c) => (
            <ContactCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} onFavorite={() => favoriteMutation.mutate(c.id)} showActions />
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <Button label="+ Add Contact" onClick={() => setShowAdd(true)} size="md" />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-end">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="w-full bg-black border-t border-white/10 rounded-t-2xl p-5 space-y-3">
              <p className="text-banana-gold text-sm font-semibold">New Contact</p>
              <input placeholder="First name" value={newContact.firstName} onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <input placeholder="Last name" value={newContact.lastName} onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <input placeholder="Phone number" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="flex gap-2">
                <Button label="Cancel" onClick={() => setShowAdd(false)} variant="secondary" size="md" />
                <Button label="Save" onClick={() => createMutation.mutate()} loading={createMutation.isPending} size="md" disabled={!newContact.firstName || !newContact.phone} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactDetail({ contact, onBack, onDelete, onFavorite }: { contact: Contact; onBack: () => void; onDelete: () => void; onFavorite: () => void }) {
  const copyNumber = () => {
    const num = contact.primaryPhone ?? contact.phoneNumbers[0]?.number;
    if (num) navigator.clipboard.writeText(num);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto px-4 py-4">
      <button type="button" onClick={onBack} className="text-banana-gold text-sm mb-4">‹ Back</button>
      <div className="flex flex-col items-center mb-6">
        <ContactAvatar contact={contact} size="lg" />
        <h2 className="text-white text-xl font-bold mt-3">{contact.fullName}</h2>
        {contact.relationshipLabel && <p className="text-white/40 text-sm">{contact.relationshipLabel}</p>}
        {contact.organizationName && <p className="text-white/50 text-sm">{contact.organizationName}</p>}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { icon: '📞', label: 'Call', action: copyNumber },
          { icon: '💬', label: 'SMS', action: copyNumber },
          { icon: '⭐', label: contact.isFavorite ? 'Unfav' : 'Fav', action: onFavorite },
          { icon: '📋', label: 'Copy', action: copyNumber },
        ].map((a) => (
          <button key={a.label} type="button" onClick={a.action} className="bg-white/5 rounded-xl py-3 flex flex-col items-center gap-1 border border-white/10">
            <span>{a.icon}</span>
            <span className="text-[9px] text-white/60">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {contact.phoneNumbers.map((p, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">{p.label}{p.primary ? ' · Primary' : ''}</p>
            <p className="text-white text-sm">{p.number}</p>
          </div>
        ))}
        {contact.email && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Email</p>
            <p className="text-white text-sm">{contact.email}</p>
          </div>
        )}
        {contact.identityNumber && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Identity Number</p>
            <p className="text-white text-sm font-mono">{contact.identityNumber}</p>
          </div>
        )}
        {contact.notes && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Notes</p>
            <p className="text-white/70 text-sm">{contact.notes}</p>
          </div>
        )}
        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((t) => <span key={t} className="text-[10px] bg-banana-gold/10 text-banana-gold px-2 py-0.5 rounded-full">{t}</span>)}
          </div>
        )}
      </div>

      <button type="button" onClick={onDelete} className="w-full mt-6 py-3 text-red-400 text-sm border border-red-400/20 rounded-xl">Delete Contact</button>
    </motion.div>
  );
}
