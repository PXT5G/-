'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';
import { useContactsStore } from '../store/contactsStore';
import { ContactCard } from '../components/ContactCard';

export function FavoritesScreen() {
  const { setSelectedContact, setTab } = useContactsStore();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'favorites'],
    queryFn: () => contactsService.getFavorites(),
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => contactsService.toggleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-3">Favorite Contacts</p>
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No favorites yet. Star contacts from the All tab.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} onClick={() => { setSelectedContact(c); setTab('list'); }} onFavorite={() => favoriteMutation.mutate(c.id)} showActions />
          ))}
        </div>
      )}
    </div>
  );
}
