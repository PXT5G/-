'use client';

import { useQuery } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';
import { useContactsStore } from '../store/contactsStore';
import { ContactCard } from '../components/ContactCard';

export function EmergencyScreen() {
  const { setSelectedContact, setTab } = useContactsStore();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'emergency'],
    queryFn: () => contactsService.getEmergency(),
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
        <p className="text-red-400 text-sm font-semibold">🆘 Emergency Contacts</p>
        <p className="text-white/50 text-xs mt-1">These contacts are prioritized for emergency calls and alerts.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No emergency contacts. Mark contacts as emergency when editing.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} onClick={() => { setSelectedContact(c); setTab('list'); }} />
          ))}
        </div>
      )}
    </div>
  );
}
