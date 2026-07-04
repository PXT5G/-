'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClockAlarms } from '@/hooks/useSystemApps';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';
import { useQuery } from '@tanstack/react-query';
import { formatTime } from '@/utils/date';

type Tab = 'alarm' | 'stopwatch' | 'timer' | 'world';

export function ClockApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('alarm');
  const { data: alarms } = useClockAlarms();
  const { data: worldClocks } = useQuery({ queryKey: ['clock', 'world'], queryFn: () => systemAppsService.getWorldClocks(), enabled: tab === 'world' });

  const [swRunning, setSwRunning] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const [timerSec, setTimerSec] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (swRunning) {
      swRef.current = setInterval(() => setSwMs((m) => m + 10), 10);
    } else if (swRef.current) clearInterval(swRef.current);
    return () => { if (swRef.current) clearInterval(swRef.current); };
  }, [swRunning]);

  useEffect(() => {
    if (!timerRunning || timerSec <= 0) return;
    const t = setInterval(() => setTimerSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning, timerSec]);

  const createAlarm = useMutation({
    mutationFn: () => systemAppsService.createAlarm({ label: 'Alarm', hour: 7, minute: 30, repeatDays: [1, 2, 3, 4, 5] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'clock'] }),
  });

  const toggleAlarm = useMutation({
    mutationFn: (id: string) => systemAppsService.toggleAlarm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'clock'] }),
  });

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'alarm' && (
          <>
            {(alarms ?? []).map((a) => (
              <div key={String(a.alarmId)} className="flex justify-between items-center p-4 mb-2 rounded-xl bg-white/5">
                <div>
                  <p className="text-3xl font-extralight text-white tabular-nums">{String(a.hour).padStart(2, '0')}:{String(a.minute).padStart(2, '0')}</p>
                  <p className="text-white/50 text-sm">{String(a.label)}</p>
                </div>
                <button type="button" onClick={() => toggleAlarm.mutate(String(a.alarmId))} className={`w-12 h-7 rounded-full ${a.enabled ? 'bg-gulf-gold' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${a.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => createAlarm.mutate()} className="w-full py-3 mt-4 rounded-xl border border-dashed border-white/20 text-gulf-gold text-sm">+ Add Alarm</button>
          </>
        )}
        {tab === 'stopwatch' && (
          <div className="text-center py-12">
            <p className="text-5xl font-extralight text-white tabular-nums mb-8">{(swMs / 1000).toFixed(2)}</p>
            <div className="flex gap-4 justify-center">
              <button type="button" onClick={() => setSwRunning(!swRunning)} className="px-8 py-3 rounded-full bg-gulf-gold text-black font-semibold">{swRunning ? 'Stop' : 'Start'}</button>
              <button type="button" onClick={() => { setSwMs(0); setSwRunning(false); }} className="px-8 py-3 rounded-full bg-white/10 text-white">Reset</button>
            </div>
          </div>
        )}
        {tab === 'timer' && (
          <div className="text-center py-12">
            <p className="text-5xl font-extralight text-white tabular-nums mb-8">{Math.floor(timerSec / 60)}:{(timerSec % 60).toString().padStart(2, '0')}</p>
            <div className="flex gap-4 justify-center">
              <button type="button" onClick={() => setTimerRunning(!timerRunning)} className="px-8 py-3 rounded-full bg-gulf-gold text-black font-semibold">{timerRunning ? 'Pause' : 'Start'}</button>
              <button type="button" onClick={() => { setTimerSec(300); setTimerRunning(false); }} className="px-8 py-3 rounded-full bg-white/10 text-white">Reset</button>
            </div>
          </div>
        )}
        {tab === 'world' && (
          (worldClocks ?? []).map((wc) => {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const city = new Date(utc + 3600000 * wc.offset);
            return (
              <div key={wc.city} className="flex justify-between p-4 mb-2 rounded-xl bg-white/5">
                <span className="text-white">{wc.city}</span>
                <span className="text-gulf-gold tabular-nums">{formatTime(city)}</span>
              </div>
            );
          })
        )}
      </div>
      <nav className="flex border-t border-white/10">
        {(['alarm', 'stopwatch', 'timer', 'world'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { tap(); setTab(t); }} className={`flex-1 py-3 text-xs capitalize ${tab === t ? 'text-gulf-gold' : 'text-white/40'}`}>{t === 'world' ? 'World' : t}</button>
        ))}
      </nav>
    </div>
  );
}
