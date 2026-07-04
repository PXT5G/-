'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotes } from '@/hooks/useSystemApps';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';

export function NotesApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const { data: notes, isLoading } = useNotes(searchQ || undefined);

  const selected = (notes ?? []).find((n) => n.noteId === selectedId);

  const create = useMutation({
    mutationFn: () => systemAppsService.createNote({ title: 'New Note', content: '' }),
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ['system-apps', 'notes'] }); setSelectedId(String(n.noteId)); setEditTitle(String(n.title)); setEditContent(''); },
  });

  const save = useMutation({
    mutationFn: () => systemAppsService.updateNote(selectedId!, { title: editTitle, content: editContent }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'notes'] }),
  });

  const pin = useMutation({
    mutationFn: () => systemAppsService.updateNote(selectedId!, { pinned: !selected?.pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'notes'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => systemAppsService.deleteNote(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-apps', 'notes'] }); setSelectedId(null); },
  });

  if (selectedId && selected) {
    return (
      <div className="h-full flex flex-col bg-black">
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <button type="button" onClick={() => setSelectedId(null)} className="text-gulf-gold text-sm">‹ Notes</button>
          <button type="button" onClick={() => pin.mutate()} className="text-xs text-white/50">{selected.pinned ? '📌' : 'Pin'}</button>
          <button type="button" onClick={() => save.mutate()} className="ml-auto text-gulf-gold text-sm">Save</button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-transparent text-xl font-bold text-white mb-4 outline-none" />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-full bg-transparent text-white/80 resize-none outline-none text-sm leading-relaxed" placeholder="Start writing..." />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Notes</h1>
        <button type="button" onClick={() => { tap(); create.mutate(); }} className="text-gulf-gold text-2xl">+</button>
      </div>
      <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search notes..." className="mx-4 mb-4 bg-white/10 text-white rounded-xl px-4 py-2 text-sm" />
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : (notes ?? []).map((n) => (
          <button
            key={String(n.noteId)}
            type="button"
            onClick={() => { setSelectedId(String(n.noteId)); setEditTitle(String(n.title)); setEditContent(String(n.content)); }}
            className="w-full text-left p-4 mb-2 rounded-xl bg-white/5"
          >
            <p className="text-white font-medium text-sm">{String(n.title)} {n.pinned ? '📌' : ''} {n.locked ? '🔒' : ''}</p>
            <p className="text-white/40 text-xs truncate mt-1">{String(n.content)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
