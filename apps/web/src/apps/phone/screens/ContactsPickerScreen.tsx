'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { contactsApi } from '@/services/contactsApi';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard } from '../components/GlassCard';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';

const APP_ID = 'com.bananaos.phone';

export function ContactsPickerScreen() {
  const [query, setQuery] = useState('');
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const queryClient = useQueryClient();
  const { tap } = useHaptic();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['phone', 'contacts', query],
    queryFn: async () => {
      if (query.trim()) return phoneService.searchContacts(query);
      const favorites = await contactsApi.getFavorites(APP_ID);
      return (favorites as Array<{ id: string; fullName: string; primaryPhone?: string; avatar?: string }>).map((c) => ({
        id: c.id,
        fullName: c.fullName,
        primaryPhone: c.primaryPhone,
        avatar: c.avatar,
      }));
    },
    enabled: true,
  });

  const handleCall = async (phone: string, contactId: string) => {
    tap();
    const result = await phoneService.makeCall(phone, contactId);
    setActiveCall(result.activeCall);
    setTab('active');
  };

  const handleAddFavorite = async (phone: string, contactId: string, name: string) => {
    tap();
    await phoneService.addFavorite({ phoneNumber: phone, label: name, contactId });
    queryClient.invalidateQueries({ queryKey: ['phone', 'favorites'] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-green-400/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)
        ) : (contacts ?? []).length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">No contacts found</div>
        ) : (
          (contacts ?? []).map((c) => {
            const phone = 'phoneNumbers' in c ? (c.primaryPhone ?? c.phoneNumbers?.[0]?.number) : c.primaryPhone;
            if (!phone) return null;
            return (
              <GlassCard key={c.id}>
                <div className="flex items-center gap-3">
                  <CallerAvatar name={c.fullName} avatar={c.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.fullName}</p>
                    <p className="text-white/40 text-[10px]">{phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleCall(phone, c.id)} className="w-9 h-9 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">📞</button>
                    <button type="button" onClick={() => handleAddFavorite(phone, c.id, c.fullName)} className="w-9 h-9 rounded-full bg-white/5 text-yellow-400 flex items-center justify-center">⭐</button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
