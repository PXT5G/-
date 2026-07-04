'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCalendarEvents } from '@/hooks/useSystemApps';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';

const EVENT_COLORS: Record<string, string> = {
  event: 'bg-blue-500', reminder: 'bg-purple-500', birthday: 'bg-pink-500',
  government: 'bg-gray-500', police_shift: 'bg-red-500', justice_hearing: 'bg-amber-600',
  bank_payment: 'bg-green-600', invitation: 'bg-gulf-gold',
};

export function CalendarApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const { data: events, isLoading } = useCalendarEvents();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');

  const create = useMutation({
    mutationFn: () => {
      const start = new Date();
      start.setHours(start.getHours() + 1);
      const end = new Date(start.getTime() + 3600000);
      return systemAppsService.createEvent({ title, startAt: start.toISOString(), endAt: end.toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-apps', 'calendar'] }); setShowNew(false); setTitle(''); },
  });

  const seed = useMutation({
    mutationFn: () => systemAppsService.seedCalendar(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'calendar'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => systemAppsService.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'calendar'] }),
  });

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Calendar</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => { tap(); seed.mutate(); }} className="text-xs text-white/50 px-2 py-1">Seed</button>
          <button type="button" onClick={() => { tap(); setShowNew(true); }} className="text-gulf-gold text-2xl">+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : (events ?? []).length === 0 ? (
          <p className="text-white/40 text-center py-12">No events</p>
        ) : (
          (events ?? []).map((e) => (
            <div key={String(e.eventId)} className="flex gap-3 p-3 mb-2 rounded-xl bg-white/5">
              <div className={`w-1 rounded-full ${EVENT_COLORS[String(e.eventType)] ?? 'bg-white/30'}`} />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{String(e.title)}</p>
                <p className="text-white/40 text-xs">{new Date(String(e.startAt)).toLocaleString()}</p>
                <p className="text-white/30 text-[10px] capitalize">{String(e.eventType).replace('_', ' ')}</p>
              </div>
              <button type="button" onClick={() => remove.mutate(String(e.eventId))} className="text-red-400/60 text-xs">✕</button>
            </div>
          ))
        )}
      </div>
      {showNew && (
        <div className="absolute inset-0 bg-black/80 flex items-end">
          <div className="w-full p-4 bg-gray-900 rounded-t-3xl">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full bg-white/10 text-white rounded-xl px-4 py-3 mb-4" />
            <button type="button" onClick={() => create.mutate()} disabled={!title} className="w-full py-3 bg-gulf-gold text-black rounded-xl font-semibold disabled:opacity-50">Create Event</button>
          </div>
        </div>
      )}
    </div>
  );
}
