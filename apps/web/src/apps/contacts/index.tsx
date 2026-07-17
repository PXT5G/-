'use client';

import { useState } from 'react';
import { useContactsInit, useContactsList, useCreateContact } from '@/hooks/useContacts';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

export function ContactsApp() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const { tap } = useHaptic();
  useContactsInit();
  const { data } = useContactsList({ search: search || undefined, category: category as never });
  const createContact = useCreateContact();

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold mb-3">Contacts</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm"
        />
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['all', 'personal', 'business', 'government', 'police', 'ems', 'justice', 'emergency'].map((c) => (
            <button
              key={c}
              onClick={() => { tap(); setCategory(c === 'all' ? undefined : c); }}
              className={cn('px-3 py-1 rounded-full text-xs capitalize shrink-0',
                (c === 'all' && !category) || category === c ? 'bg-gulf-gold text-black' : 'bg-white/10')}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(data?.contacts ?? []).map((c) => (
          <div key={c.contactId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
              {c.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {c.favorite && <span className="text-[10px]">⭐</span>}
                {c.emergency && <span className="text-[10px]">🚨</span>}
                <p className="font-medium truncate">{c.displayName}</p>
              </div>
              <p className="text-xs text-white/50">{c.phones[0]?.number ?? c.emails[0]?.email}</p>
              <p className="text-[10px] text-white/30 capitalize">{c.category}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => void createContact.mutateAsync({ displayName: 'New Contact', firstName: 'New', category: 'personal', phones: [], emails: [] })}
        className="m-4 py-3 bg-gulf-gold text-black rounded-xl font-medium"
      >+ Add Contact</button>
    </div>
  );
}

export default ContactsApp;
