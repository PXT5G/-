'use client';

import { useState } from 'react';
import { useMailInit, useMailMessages } from '@/hooks/useMail';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

const FOLDERS = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'] as const;

export function MailApp() {
  const [folder, setFolder] = useState<string>('inbox');
  const [search, setSearch] = useState('');
  const { tap } = useHaptic();
  useMailInit();
  const { data } = useMailMessages(folder, search || undefined);

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold mb-3">Mail</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mail..."
          className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm mb-3"
        />
        <div className="flex gap-2 overflow-x-auto">
          {FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => { tap(); setFolder(f); }}
              className={cn('px-3 py-1 rounded-full text-xs capitalize shrink-0',
                folder === f ? 'bg-gulf-gold text-black' : 'bg-white/10')}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(data?.messages ?? []).map((m) => (
          <div key={String(m.messageId)} className={cn('p-4 border-b border-white/5', !m.isRead && 'bg-white/5')}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate">{String(m.from)}</p>
              {Boolean(m.isStarred) && <span>⭐</span>}
            </div>
            <p className="text-sm truncate">{String(m.subject)}</p>
            <p className="text-xs text-white/40 truncate mt-1">{String(m.bodyText)}</p>
          </div>
        ))}
        {(data?.messages ?? []).length === 0 && (
          <p className="text-center text-white/40 py-12">No messages in {folder}</p>
        )}
      </div>
    </div>
  );
}

export default MailApp;
