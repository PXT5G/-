'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePoetryInit, usePoetrySocketSync, usePoetryHome, usePoetryPoem, usePoetryPoems,
  usePoetrySearch, usePoetryBookmarks, usePoetryFavorites, usePoetryHistory,
  usePoetryVerifiedPoets, usePoetryCollections, usePoetryEvents,
  usePoetryCompetitions, usePoetryChallenges, usePoetryAnalytics,
  useCreatePoem, useLikePoem, usePoetryComment, usePoetryRandom,
} from '@/hooks/usePoetry';
import { useAuthStore } from '@/stores/authStore';
import { poetryService } from '@/services/poetryService';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'library' | 'search' | 'compose' | 'more';
type LibraryTab = 'bookmarks' | 'favorites' | 'history' | 'collections' | 'drafts';

const CATEGORY_LABELS: Record<string, string> = {
  national: 'National', pride: 'Pride', military: 'Military', police: 'Police',
  justice: 'Justice', love: 'Love', sadness: 'Sadness', wisdom: 'Wisdom',
  religion: 'Religion', occasions: 'Occasions', events: 'Events',
  server_story: 'Server Story', roleplay: 'Roleplay', custom: 'Custom',
};

function GlassCard({ children, className, accent }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl bg-white/5 border backdrop-blur-md',
      accent ? 'border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-white/10',
      className
    )}>
      {children}
    </div>
  );
}

function GulfGLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0a0a0a" />
      <path d="M12 20 L44 12 L52 36 L28 52 L12 44 Z" fill="#DC2626" opacity="0.9" />
      <path d="M24 28 L40 24 L44 38 L30 44 Z" fill="#E5E7EB" opacity="0.85" />
    </svg>
  );
}

function PoemCard({ poem, onPress }: { poem: Record<string, unknown>; onPress: (id: string) => void }) {
  const id = String(poem.poemId);
  return (
    <button type="button" onClick={() => onPress(id)} className="w-full text-left">
      <GlassCard className="p-4 mb-3 hover:bg-white/8 transition-colors" accent={Boolean(poem.featured)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {Boolean(poem.pinned) && <span className="text-[10px] text-red-400 uppercase">Pinned</span>}
              {Boolean(poem.isDailyPoem) && <span className="text-[10px] text-gulf-gold uppercase">Daily</span>}
              {Boolean(poem.authorIsServerPoet) && <span className="text-[10px] text-red-400">★ Server Poet</span>}
            </div>
            <h3 className="text-white font-semibold truncate">{String(poem.title)}</h3>
            <p className="text-white/50 text-xs mt-1 line-clamp-2">{String(poem.excerpt ?? '')}</p>
            <p className="text-white/40 text-[10px] mt-2">
              {String(poem.authorName ?? 'Poet')} · {CATEGORY_LABELS[String(poem.category)] ?? String(poem.category)}
            </p>
          </div>
          <div className="text-right text-[10px] text-white/40 shrink-0">
            <p>❤️ {Number(poem.likeCount ?? 0)}</p>
            <p className="mt-1">👁 {Number(poem.viewCount ?? 0)}</p>
          </div>
        </div>
      </GlassCard>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function HomeScreen({ onPoem, onRandom }: { onPoem: (id: string) => void; onRandom: () => void }) {
  const { data, isLoading } = usePoetryHome();
  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full pb-24">
      <GlassCard className="p-4" accent>
        <div className="flex items-center gap-3">
          <GulfGLogo size={40} />
          <div>
            <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">GULF Poetry</p>
            <p className="text-white font-bold">Server Poet Platform</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onRandom} className="flex-1 py-2 rounded-xl bg-red-600/80 text-white text-xs font-semibold">
            🎲 Random Poem
          </button>
        </div>
      </GlassCard>

      {data.daily && (
        <section>
          <h2 className="text-gulf-gold text-xs font-semibold uppercase tracking-wider mb-2">Daily Poem</h2>
          <PoemCard poem={data.daily} onPress={onPoem} />
        </section>
      )}

      {data.announcements.length > 0 && (
        <section>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Announcements</h2>
          {data.announcements.map((a) => (
            <GlassCard key={String(a.announcementId)} className="p-3 mb-2">
              <p className="text-white text-sm font-medium">{String(a.title)}</p>
              <p className="text-white/50 text-xs mt-1">{String(a.body)}</p>
            </GlassCard>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-gulf-gold text-xs font-semibold uppercase tracking-wider mb-2">Featured</h2>
        {data.featured.map((p) => <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />)}
      </section>

      <section>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Latest</h2>
        {data.latest.slice(0, 5).map((p) => <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />)}
      </section>

      <section>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Popular</h2>
        {data.popular.slice(0, 5).map((p) => <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />)}
      </section>

      <section>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Trending</h2>
        {data.trending.map((p) => <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />)}
      </section>

      <section>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {data.categories.map((c) => (
            <span key={c} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs capitalize">
              {CATEGORY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function PoemDetail({ poemId, onBack }: { poemId: string; onBack: () => void }) {
  const { data: poem, isLoading } = usePoetryPoem(poemId);
  const like = useLikePoem();
  const comment = usePoetryComment(poemId);
  const token = useAuthStore((s) => s.getAccessToken());
  const { tap, success } = useHaptic();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!token) return;
    poetryService.getComments(token, poemId).then(setComments).catch(() => {});
  }, [token, poemId, poem]);

  if (isLoading || !poem) return <LoadingState />;

  const handleExport = async () => {
    if (!token) return;
    tap();
    const pdf = await poetryService.exportPdf(token, poemId);
    const blob = new Blob([pdf.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdf.filename.replace('.pdf', '.txt');
    a.click();
    URL.revokeObjectURL(url);
    success();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
      <div className="p-4 border-b border-white/10">
        <button type="button" onClick={onBack} className="text-red-400 text-sm mb-2">‹ Back</button>
        <h1 className="text-white text-xl font-bold">{String(poem.title)}</h1>
        <p className="text-white/50 text-sm mt-1">
          {String(poem.authorName)}
          {Boolean(poem.authorVerified) && ' ✓'}
          {Boolean(poem.authorIsServerPoet) && ' · ★ Server Poet'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <GlassCard className="p-4 mb-4">
          <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
            {String(poem.markdown || poem.content)}
          </p>
        </GlassCard>
        {(Boolean(poem.audioUrl) || Boolean(poem.videoUrl)) && (
          <GlassCard className="p-3 mb-4">
            {Boolean(poem.audioUrl) && <p className="text-white/60 text-xs">🎙️ Audio poetry attached</p>}
            {Boolean(poem.videoUrl) && <p className="text-white/60 text-xs mt-1">🎬 Video attached</p>}
          </GlassCard>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {(poem.tags as string[] ?? []).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px]">#{t}</span>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          <button type="button" onClick={() => { tap(); like.mutate(poemId); }}
            className={cn('flex-1 py-2 rounded-xl text-xs font-semibold', poem.liked ? 'bg-red-600 text-white' : 'bg-white/10 text-white')}>
            ❤️ {Number(poem.likeCount ?? 0)}
          </button>
          <button type="button" onClick={async () => { tap(); if (token) { await poetryService.toggleBookmark(token, poemId); } }}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold">
            {poem.bookmarked ? '🔖 Saved' : '🔖 Bookmark'}
          </button>
          <button type="button" onClick={async () => { tap(); if (token) { await poetryService.sharePoem(token, poemId); } }}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold">↗ Share</button>
          <button type="button" onClick={handleExport}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold">📄 Export</button>
        </div>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-2">Comments</h3>
        {comments.map((c) => (
          <GlassCard key={String(c.commentId)} className="p-3 mb-2">
            <p className="text-white/80 text-sm">{String(c.body)}</p>
            <p className="text-white/40 text-[10px] mt-1">{String(c.authorName)}</p>
          </GlassCard>
        ))}
      </div>
      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
        />
        <button type="button" onClick={() => {
          if (!commentText.trim()) return;
          tap();
          comment.mutate(commentText, { onSuccess: () => setCommentText('') });
        }} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold">Post</button>
      </div>
    </div>
  );
}

function ComposeScreen({ onDone }: { onDone: (id: string) => void }) {
  const create = useCreatePoem();
  const { tap, success } = useHaptic();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('custom');
  const [tags, setTags] = useState('');

  const save = useCallback((publish = false) => {
    if (!title.trim()) return;
    tap();
    create.mutate({
      title,
      content,
      markdown: content,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: publish ? 'published' : 'draft',
    }, {
      onSuccess: (data) => {
        success();
        onDone(String(data.poemId));
      },
    });
  }, [title, content, category, tags, create, tap, success, onDone]);

  return (
    <div className="p-4 h-full overflow-y-auto pb-24">
      <h2 className="text-white font-bold text-lg mb-4">Compose</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poem title"
        className="w-full bg-white/10 rounded-xl px-4 py-3 text-white mb-3 outline-none" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-white/10 rounded-xl px-4 py-3 text-white mb-3 outline-none">
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)"
        className="w-full bg-white/10 rounded-xl px-4 py-3 text-white mb-3 outline-none" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your poem... (Markdown supported)"
        rows={12} className="w-full bg-white/10 rounded-xl px-4 py-3 text-white mb-4 outline-none resize-none font-serif leading-relaxed" />
      <div className="flex gap-2">
        <button type="button" onClick={() => save(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm">Save Draft</button>
        <button type="button" onClick={() => save(true)} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm">Publish</button>
      </div>
    </div>
  );
}

function LibraryScreen({ onPoem }: { onPoem: (id: string) => void }) {
  const [libTab, setLibTab] = useState<LibraryTab>('bookmarks');
  const bookmarks = usePoetryBookmarks();
  const favorites = usePoetryFavorites();
  const history = usePoetryHistory();
  const collections = usePoetryCollections();
  const drafts = usePoetryPoems({ mine: 'true', status: 'draft' });

  const tabs: { id: LibraryTab; label: string }[] = [
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'history', label: 'History' },
    { id: 'collections', label: 'Collections' },
    { id: 'drafts', label: 'Drafts' },
  ];

  const data = {
    bookmarks: bookmarks.data ?? [],
    favorites: favorites.data ?? [],
    history: history.data ?? [],
    collections: collections.data ?? [],
    drafts: drafts.data ?? [],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex overflow-x-auto gap-1 p-3 border-b border-white/10">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setLibTab(t.id)}
            className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap', libTab === t.id ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {libTab === 'collections' ? (
          (data.collections as Record<string, unknown>[]).map((c) => (
            <GlassCard key={String(c.collectionId)} className="p-4 mb-3">
              <p className="text-white font-semibold">{String(c.title)}</p>
              <p className="text-white/50 text-xs mt-1">{String(c.description)}</p>
              <p className="text-red-400 text-[10px] mt-2">{Number(c.poemCount ?? 0)} poems</p>
            </GlassCard>
          ))
        ) : (
          (data[libTab] as Record<string, unknown>[]).map((p) => (
            <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />
          ))
        )}
        {(data[libTab] as unknown[]).length === 0 && (
          <p className="text-white/40 text-center py-12 text-sm">Nothing here yet</p>
        )}
      </div>
    </div>
  );
}

function SearchScreen({ onPoem }: { onPoem: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const { data, isLoading } = usePoetrySearch(query, sort);
  const poets = usePoetryVerifiedPoets();

  return (
    <div className="p-4 h-full overflow-y-auto pb-24">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search poems, authors, tags..."
        className="w-full bg-white/10 rounded-xl px-4 py-3 text-white mb-3 outline-none" />
      <div className="flex gap-2 mb-4">
        {['date', 'popularity', 'title'].map((s) => (
          <button key={s} type="button" onClick={() => setSort(s)}
            className={cn('px-3 py-1 rounded-full text-xs capitalize', sort === s ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60')}>
            {s}
          </button>
        ))}
      </div>
      {poets.data && poets.data.length > 0 && (
        <section className="mb-4">
          <h3 className="text-gulf-gold text-xs uppercase tracking-wider mb-2">Verified Poets</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {poets.data.map((p) => (
              <GlassCard key={String(p.userId)} className="p-3 shrink-0 w-36" accent={Boolean(p.isServerPoet)}>
                <p className="text-white text-sm font-medium truncate">{String(p.displayName)}</p>
                {Boolean(p.isServerPoet) && <p className="text-red-400 text-[10px]">★ Server Poet</p>}
                {Boolean(p.verified) && <p className="text-gulf-gold text-[10px]">✓ Verified</p>}
              </GlassCard>
            ))}
          </div>
        </section>
      )}
      {isLoading && query && <LoadingState />}
      {data?.map((p) => <PoemCard key={String(p.poemId)} poem={p} onPress={onPoem} />)}
    </div>
  );
}

function MoreScreen() {
  const events = usePoetryEvents();
  const competitions = usePoetryCompetitions();
  const challenges = usePoetryChallenges();
  const analytics = usePoetryAnalytics();
  const userId = useAuthStore((s) => s.user?.id);

  return (
    <div className="p-4 h-full overflow-y-auto pb-24 space-y-5">
      {analytics.data && (
        <GlassCard className="p-4" accent>
          <h3 className="text-gulf-gold text-xs uppercase tracking-wider mb-3">Platform Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Poems', analytics.data.totalPoems],
              ['Poets', analytics.data.totalPoets],
              ['Likes', analytics.data.totalLikes],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <p className="text-white text-lg font-bold">{Number(v)}</p>
                <p className="text-white/40 text-[10px]">{String(l)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      <section>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-2">Events</h3>
        {(events.data ?? []).map((e) => (
          <GlassCard key={String(e.eventId)} className="p-3 mb-2">
            <p className="text-white text-sm font-medium">{String(e.title)}</p>
            <p className="text-white/50 text-xs">{String(e.eventType)} · {String(e.status)}</p>
          </GlassCard>
        ))}
      </section>
      <section>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-2">Competitions</h3>
        {(competitions.data ?? []).map((c) => (
          <GlassCard key={String(c.competitionId)} className="p-3 mb-2">
            <p className="text-white text-sm font-medium">{String(c.title)}</p>
            <p className="text-white/50 text-xs">{Number(c.entryCount ?? 0)} entries</p>
          </GlassCard>
        ))}
      </section>
      <section>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-2">Challenges</h3>
        {(challenges.data ?? []).map((c) => (
          <GlassCard key={String(c.challengeId)} className="p-3 mb-2">
            <p className="text-white text-sm font-medium">{String(c.title)}</p>
            <p className="text-white/50 text-xs italic">{String(c.prompt)}</p>
          </GlassCard>
        ))}
      </section>
      {userId && (
        <button type="button" onClick={() => window.location.hash = `profile-${userId}`}
          className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-semibold">
          View My Profile
        </button>
      )}
    </div>
  );
}

export function PoetryApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedPoem, setSelectedPoem] = useState<string | null>(null);
  const { tap } = useHaptic();
  const random = usePoetryRandom();

  usePoetryInit();
  usePoetrySocketSync();

  const openPoem = useCallback((id: string) => {
    tap();
    setSelectedPoem(id);
  }, [tap]);

  const handleRandom = useCallback(() => {
    tap();
    random.mutate(undefined, {
      onSuccess: (data) => setSelectedPoem(String(data.poemId)),
    });
  }, [tap, random]);

  if (selectedPoem) {
    return <PoemDetail poemId={selectedPoem} onBack={() => setSelectedPoem(null)} />;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'compose', label: 'Write', icon: '✍️' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a12] via-[#120a0a] to-black">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }} className="h-full">
            {tab === 'home' && <HomeScreen onPoem={openPoem} onRandom={handleRandom} />}
            {tab === 'library' && <LibraryScreen onPoem={openPoem} />}
            {tab === 'search' && <SearchScreen onPoem={openPoem} />}
            {tab === 'compose' && <ComposeScreen onDone={openPoem} />}
            {tab === 'more' && <MoreScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
      <nav className="border-t border-white/10 bg-black/80 backdrop-blur-lg px-2 py-2 safe-area-bottom">
        <div className="flex">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { tap(); setTab(t.id); }}
              className={cn('flex-1 flex flex-col items-center py-1.5 rounded-xl transition-colors',
                tab === t.id ? 'text-red-400' : 'text-white/40')}>
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
