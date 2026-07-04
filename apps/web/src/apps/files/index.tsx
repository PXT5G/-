'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileSystemService } from '@/services/fileSystemService';
import { systemAppsService } from '@/services/systemAppsService';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import type { FileNode } from '@/types';

type Tab = 'browse' | 'recent' | 'categories' | 'search';

const CATEGORIES = ['documents', 'images', 'videos', 'audio', 'downloads', 'archives'];

export function FilesApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken()) ?? '';
  const [tab, setTab] = useState<Tab>('browse');
  const [parentId, setParentId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [category, setCategory] = useState('documents');

  useEffect(() => {
    systemAppsService.initFolders().catch(() => {});
  }, []);

  const { data: files } = useQuery({
    queryKey: ['files', 'browse', parentId],
    queryFn: () => fileSystemService.list(token, parentId ?? undefined),
    enabled: tab === 'browse' && !!token,
  });

  const { data: recent } = useQuery({
    queryKey: ['files', 'recent'],
    queryFn: () => systemAppsService.getRecentFiles(),
    enabled: tab === 'recent',
  });

  const { data: catFiles } = useQuery({
    queryKey: ['files', 'category', category],
    queryFn: () => systemAppsService.getFilesByCategory(category),
    enabled: tab === 'categories',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['files', 'search', searchQ],
    queryFn: () => systemAppsService.searchFiles(searchQ),
    enabled: tab === 'search' && searchQ.length >= 1,
  });

  const createFolder = useMutation({
    mutationFn: (name: string) => fileSystemService.createFolder(name, token, parentId ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });

  const displayFiles: Array<FileNode | Record<string, unknown>> = tab === 'browse' ? (files ?? []) : tab === 'recent' ? (recent ?? []) : tab === 'categories' ? (catFiles ?? []) : (searchResults ?? []);

  const fileIcon = (f: FileNode | Record<string, unknown>) => {
    if (f.type === 'folder') return '📁';
    const mime = String(f.mimeType ?? '');
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('zip')) return '🗜️';
    if (mime.startsWith('image')) return '🖼️';
    return '📄';
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'search' && (
          <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search files..." className="w-full bg-white/10 text-white rounded-xl px-4 py-3 mb-4 text-sm" />
        )}
        {tab === 'categories' && (
          <div className="flex gap-2 flex-wrap mb-4">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs capitalize ${category === c ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'}`}>{c}</button>
            ))}
          </div>
        )}
        {tab === 'browse' && parentId && (
          <button type="button" onClick={() => setParentId(null)} className="text-gulf-gold text-sm mb-4">‹ Back</button>
        )}
        {(displayFiles ?? []).length === 0 ? (
          <p className="text-white/40 text-center py-12">No files</p>
        ) : (
          displayFiles.map((f) => (
            <button
              key={String(f.id)}
              type="button"
              onClick={() => { tap(); if (f.type === 'folder') setParentId(String(f.id)); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-2 text-left"
            >
              <span className="text-2xl">{fileIcon(f)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{String(f.name)}</p>
                <p className="text-white/40 text-xs">{f.type === 'file' ? `${(((f.size as number) ?? 0) / 1024).toFixed(0)} KB` : 'Folder'}</p>
              </div>
            </button>
          ))
        )}
        {tab === 'browse' && (
          <button type="button" onClick={() => { tap(); createFolder.mutate(`Folder ${Date.now()}`); }} className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/20 text-white/50 text-sm">
            + New Folder
          </button>
        )}
      </div>
      <nav className="flex border-t border-white/10">
        {(['browse', 'recent', 'categories', 'search'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { tap(); setTab(t); }} className={`flex-1 py-3 text-xs capitalize ${tab === t ? 'text-gulf-gold' : 'text-white/40'}`}>{t}</button>
        ))}
      </nav>
    </div>
  );
}
