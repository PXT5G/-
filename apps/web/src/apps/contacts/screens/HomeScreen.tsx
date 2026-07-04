'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { contactsService } from '../services/contactsService';
import { useContactsStore } from '../store/contactsStore';
import { ContactCard } from '../components/ContactCard';

export function HomeScreen() {
  const { setDashboard, setTab, setSelectedContact } = useContactsStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['contacts', 'dashboard'],
    queryFn: async () => {
      const d = await contactsService.getDashboard();
      setDashboard(d);
      return d;
    },
  });

  if (isLoading || !dashboard) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'Total', value: dashboard.totalContacts, icon: '👤' },
    { label: 'Favorites', value: dashboard.favoriteCount, icon: '⭐' },
    { label: 'Groups', value: dashboard.groupCount, icon: '👥' },
    { label: 'Emergency', value: dashboard.emergencyCount, icon: '🆘' },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-br from-banana-gold/15 via-black/70 to-black/90 backdrop-blur-2xl rounded-2xl border border-banana-gold/20 p-5 mb-4">
          <p className="text-[10px] text-banana-gold uppercase tracking-widest">Contact Hub</p>
          <p className="text-3xl font-bold text-white mt-1">{dashboard.totalContacts}</p>
          <p className="text-sm text-white/50">contacts managed</p>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10">
            {stats.map((s) => (
              <button key={s.label} type="button" onClick={() => setTab(s.label === 'Favorites' ? 'favorites' : s.label === 'Groups' ? 'groups' : s.label === 'Emergency' ? 'emergency' : 'list')} className="text-center">
                <span className="text-sm">{s.icon}</span>
                <p className="text-white text-sm font-medium">{s.value}</p>
                <p className="text-[8px] text-white/40">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">Blocked</p>
            <p className="text-white text-lg font-medium">{dashboard.blockedCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">Organizations</p>
            <p className="text-white text-lg font-medium">{dashboard.organizationCount}</p>
          </div>
        </div>

        {dashboard.recentContacts.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Recent</p>
            <div className="space-y-2">
              {dashboard.recentContacts.map((c) => (
                <ContactCard key={c.id} contact={c} onClick={() => { setSelectedContact(c); setTab('list'); }} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
