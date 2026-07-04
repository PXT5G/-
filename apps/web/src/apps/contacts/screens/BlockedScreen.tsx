'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';
import { useContactsStore } from '../store/contactsStore';
import { ContactCard } from '../components/ContactCard';

export function BlockedScreen() {
  const { setSelectedContact, setTab } = useContactsStore();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'blocked'],
    queryFn: () => contactsService.list({ blocked: true }),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => contactsService.unblock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Blocked Contacts</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No blocked contacts.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="flex-1"><ContactCard contact={c} onClick={() => { setSelectedContact(c); setTab('list'); }} /></div>
              <button type="button" onClick={() => unblockMutation.mutate(c.id)} className="text-banana-gold text-xs px-3 py-2 border border-banana-gold/30 rounded-lg">Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
