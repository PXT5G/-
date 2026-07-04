'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVoiceRecordings } from '@/hooks/useSystemApps';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';

export function VoiceRecorderApp() {
  const { tap, success } = useHaptic();
  const qc = useQueryClient();
  const { data: recordings, isLoading } = useVoiceRecordings();
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [recording]);

  const save = useMutation({
    mutationFn: () => systemAppsService.createRecording({ durationSeconds: duration, noiseReduction, name: `Recording ${new Date().toLocaleTimeString()}` }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-apps', 'voice-recorder'] }); setDuration(0); success(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => systemAppsService.deleteRecording(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'voice-recorder'] }),
  });

  const toggleRecord = () => {
    tap();
    if (recording) {
      setRecording(false);
      if (duration > 0) save.mutate();
    } else {
      setDuration(0);
      setRecording(true);
    }
  };

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${recording ? 'bg-red-500/20 animate-pulse' : 'bg-white/5'}`}>
          <span className="text-5xl">🎙️</span>
        </div>
        <p className="text-4xl font-extralight text-white tabular-nums mb-2">{formatDur(duration)}</p>
        <p className="text-white/40 text-sm mb-8">{recording ? 'Recording...' : 'Tap to record'}</p>
        <button
          type="button"
          onClick={toggleRecord}
          disabled={save.isPending}
          className={`w-20 h-20 rounded-full flex items-center justify-center ${recording ? 'bg-red-500' : 'bg-gulf-gold'}`}
        >
          <div className={`${recording ? 'w-6 h-6 rounded-sm bg-white' : 'w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1'}`} />
        </button>
        <label className="flex items-center gap-2 mt-6 text-sm text-white/60">
          <input type="checkbox" checked={noiseReduction} onChange={(e) => setNoiseReduction(e.target.checked)} />
          Noise Reduction
        </label>
      </div>
      <div className="p-4 border-t border-white/10 max-h-48 overflow-y-auto">
        <p className="text-xs text-white/40 uppercase mb-2">Recordings</p>
        {isLoading ? null : (recordings ?? []).map((r) => (
          <div key={String(r.recordingId)} className="flex justify-between items-center py-2 border-b border-white/5">
            <div>
              <p className="text-white text-sm">{String(r.name)}</p>
              <p className="text-white/40 text-xs">{formatDur(Number(r.durationSeconds))} · {((Number(r.sizeBytes) / 1024)).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => remove.mutate(String(r.recordingId))} className="text-red-400/60 text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
