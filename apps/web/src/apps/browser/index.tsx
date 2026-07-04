'use client';

import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useBrowserInit, useBrowserSocketSync, useBrowserHome, useBrowserNavigate,
  useBrowserCreateTab, useBrowserCloseTab, useBrowserBookmarks, useBrowserHistory,
  useBrowserDownloads, useBrowserReadingList, useBrowserAddBookmark, useBrowserStartDownload,
  useBrowserIncognito, useBrowserClearHistory,
} from '@/hooks/useBrowser';
import { useAuthStore } from '@/stores/authStore';
import { browserService, type BrowserPage } from '@/services/browserService';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Panel = 'none' | 'tabs' | 'bookmarks' | 'history' | 'downloads' | 'reading' | 'menu' | 'find' | 'qr';

function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4">{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-white mb-3">{line.slice(3)}</h2>;
    if (line.startsWith('• ')) return <li key={i} className="text-white/80 ml-4 mb-1">{line.slice(2)}</li>;
    if (line.startsWith('> ')) return <p key={i} className="text-white/60 italic mb-2 border-l-2 border-red-500/50 pl-3">{line.slice(2)}</p>;
    if (!line.trim()) return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-white/80 mb-2 leading-relaxed">
        {parts.map((p, j) =>
          p.startsWith('**') ? <strong key={j} className="text-gulf-gold">{p.slice(2, -2)}</strong> : p
        )}
      </p>
    );
  });
}

function PageContent({ page, readerMode }: { page: BrowserPage | null; readerMode: boolean }) {
  if (!page) {
    return (
      <div className="p-6 text-center text-white/40">
        <p className="text-4xl mb-4">🌐</p>
        <p className="text-sm">Enter a URL or search with GULF Search</p>
      </div>
    );
  }
  if (page.type === 'search') {
    return (
      <div className="p-4 space-y-3">
        <p className="text-white/50 text-xs uppercase tracking-wider">GULF Search — {page.query}</p>
        {(page.results ?? []).map((r, i) => (
          <Glass key={i} className="p-3">
            <p className="text-gulf-gold text-sm font-medium">{String(r.title)}</p>
            <p className="text-white/40 text-xs mt-1">{String(r.url)}</p>
            <p className="text-white/60 text-xs mt-2">{String(r.description ?? '')}</p>
          </Glass>
        ))}
        {(page.results ?? []).length === 0 && <p className="text-white/40 text-center py-8">No results</p>}
      </div>
    );
  }
  const content = readerMode ? (page.readerContent ?? page.content ?? '') : (page.content ?? '');
  return (
    <div className="p-5 max-w-3xl mx-auto">
      {page.httpsValid && (
        <div className="flex items-center gap-1 text-green-400 text-[10px] mb-3 uppercase tracking-wider">
          <span>🔒</span> HTTPS Valid
        </div>
      )}
      {page.deepLink?.appBundle && (
        <Glass className="p-3 mb-4 flex items-center justify-between">
          <span className="text-white/70 text-xs">Open in {page.deepLink.appBundle.replace('com.gulfos.', 'GULF ')}</span>
          <span className="text-gulf-gold text-xs">{page.deepLink.nativeUrl}</span>
        </Glass>
      )}
      {renderMarkdown(content)}
    </div>
  );
}

function NewTabHome({ onNavigate }: { onNavigate: (url: string) => void }) {
  const { data: home } = useBrowserHome();
  const links = (home?.quickLinks as { url: string; title: string; portalType: string; description?: string }[]) ?? [];

  return (
    <div className="p-5 space-y-6">
      <div className="text-center pt-8">
        <p className="text-5xl mb-3">🌐</p>
        <h1 className="text-white text-2xl font-bold">GULF Browser</h1>
        <p className="text-white/40 text-sm mt-1">Browse the Gulf with GULF Search</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => (
          <button
            key={link.url}
            type="button"
            onClick={() => onNavigate(link.url)}
            className="text-left"
          >
            <Glass className="p-4 hover:bg-white/8 transition-colors h-full">
              <p className="text-gulf-gold text-xs uppercase">{link.portalType}</p>
              <p className="text-white font-medium text-sm mt-1">{link.title}</p>
              {link.description && <p className="text-white/40 text-[10px] mt-1 line-clamp-2">{link.description}</p>}
            </Glass>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BrowserApp() {
  const { data: init, isLoading, refetch } = useBrowserInit();
  useBrowserSocketSync();
  const navigate = useBrowserNavigate();
  const createTab = useBrowserCreateTab();
  const closeTab = useBrowserCloseTab();
  const addBookmark = useBrowserAddBookmark();
  const startDownload = useBrowserStartDownload();
  const incognito = useBrowserIncognito();
  const clearHistory = useBrowserClearHistory();
  const { tap } = useHaptic();
  const token = useAuthStore((s) => s.getAccessToken());

  const [panel, setPanel] = useState<Panel>('none');
  const [addressBar, setAddressBar] = useState('');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [page, setPage] = useState<BrowserPage | null>(null);
  const [readerMode, setReaderMode] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState<{ matches: number; highlights: string } | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [isIncognito, setIsIncognito] = useState(false);
  const [showTabOverview, setShowTabOverview] = useState(false);

  const tabs = useMemo(() => (init?.tabs ?? []) as Record<string, unknown>[], [init]);
  const activeTab = tabs.find((t) => t.tabId === activeTabId) ?? tabs[0];

  useEffect(() => {
    if (init?.session) {
      setSessionId(String(init.session.sessionId));
      setIsIncognito(Boolean(init.session.incognito));
      const aid = init.session.activeTabId ?? init.tabs?.[0]?.tabId;
      if (aid) setActiveTabId(String(aid));
    }
  }, [init]);

  useEffect(() => {
    if (activeTab?.url) setAddressBar(String(activeTab.url));
  }, [activeTab]);

  const goTo = useCallback(async (url: string) => {
    if (!activeTabId || !token) return;
    tap();
    let target = url.trim();
    if (!target.startsWith('http') && !target.startsWith('about:')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        target = `https://search.gulfos?q=${encodeURIComponent(target)}`;
      }
    }
    setAddressBar(target);
    try {
      const result = await navigate.mutateAsync({ tabId: activeTabId, url: target });
      setPage(result.page);
      await refetch();
    } catch {
      setPage({ content: `# Site Not Found\n\nCould not load **${target}**.\n\nTry a GULFOS portal URL or use GULF Search.` });
    }
  }, [activeTabId, token, navigate, refetch, tap]);

  const handleNewTab = async () => {
    if (!sessionId) return;
    tap();
    const tab = await createTab.mutateAsync({ sessionId });
    setActiveTabId(String(tab.tabId));
    setPage(null);
    await refetch();
  };

  const handleCloseTab = async (tabId: string) => {
    tap();
    await closeTab.mutateAsync(tabId);
    await refetch();
  };

  const handleBookmark = () => {
    if (!page?.url && !activeTab?.url) return;
    tap();
    addBookmark.mutate({
      url: String(page?.url ?? activeTab?.url),
      title: String(page?.title ?? activeTab?.title ?? 'Page'),
      favorite: true,
    });
  };

  const handleDownload = () => {
    const url = String(page?.url ?? activeTab?.url ?? '');
    if (!url) return;
    tap();
    startDownload.mutate({ url, filename: 'page-download.pdf', mimeType: 'application/pdf' });
  };

  const handleFind = async () => {
    if (!findQuery || !page?.content || !token) return;
    const result = await browserService.findInPage(token, page.content, findQuery);
    setFindResult(result);
  };

  const handleQr = async () => {
    const url = String(page?.url ?? activeTab?.url ?? 'https://www.gulfos.com');
    if (!token) return;
    const result = await browserService.generateQr(token, url);
    setQrData(result.dataUrl);
    setPanel('qr');
  };

  const handleTranslate = async () => {
    if (!page?.content || !token) return;
    const result = await browserService.translate(token, page.content, 'en');
    setPage({ ...page, content: result.translated });
  };

  const handleIncognito = async () => {
    tap();
    await incognito.mutateAsync();
    await refetch();
    setIsIncognito(true);
    setPage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-black', isIncognito && 'ring-2 ring-purple-500/30')}>
      {/* Dynamic Island / status bar accent */}
      {isIncognito && (
        <div className="bg-purple-900/40 text-purple-200 text-[10px] text-center py-1 uppercase tracking-widest">
          Private Browsing
        </div>
      )}

      {/* Tab strip */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-black/90 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={String(tab.tabId)}
            type="button"
            onClick={() => { tap(); setActiveTabId(String(tab.tabId)); setPage(null); }}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors shrink-0',
              activeTabId === tab.tabId ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50'
            )}
          >
            {Boolean(tab.pinned) && <span>📌</span>}
            <span className="max-w-[80px] truncate">{String(tab.title)}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleCloseTab(String(tab.tabId)); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCloseTab(String(tab.tabId))}
              className="ml-1 text-white/30 hover:text-white"
            >×</span>
          </button>
        ))}
        <button type="button" onClick={handleNewTab} className="px-2 py-1.5 text-white/40 hover:text-white text-lg shrink-0">+</button>
        <button type="button" onClick={() => setShowTabOverview(!showTabOverview)} className="px-2 py-1.5 text-white/40 hover:text-white text-sm shrink-0">⊞</button>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/80 border-b border-white/10">
        <button type="button" onClick={() => goTo(init?.profile?.homePageUrl as string ?? 'https://www.gulfos.com')} className="text-white/50 text-sm">⌂</button>
        <form
          className="flex-1"
          onSubmit={(e) => { e.preventDefault(); goTo(addressBar); }}
        >
          <input
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
            placeholder="Search or enter URL"
          />
        </form>
        <button type="button" onClick={() => goTo(addressBar)} className="text-gulf-gold text-sm font-medium">Go</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 border-b border-white/5 overflow-x-auto">
        {[
          { icon: '🔖', action: handleBookmark, label: 'Bookmark' },
          { icon: '📥', action: handleDownload, label: 'Download' },
          { icon: '📖', action: () => setReaderMode(!readerMode), label: 'Reader', active: readerMode },
          { icon: '🖥', action: () => setDesktopMode(!desktopMode), label: 'Desktop', active: desktopMode },
          { icon: '🔍', action: () => setPanel('find'), label: 'Find' },
          { icon: '🌐', action: handleTranslate, label: 'Translate' },
          { icon: '📱', action: handleQr, label: 'QR' },
          { icon: '☰', action: () => setPanel('menu'), label: 'Menu' },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.label}
            onClick={() => { tap(); btn.action(); }}
            className={cn(
              'px-2.5 py-1 rounded-lg text-sm transition-colors shrink-0',
              btn.active ? 'bg-red-500/20 text-red-400' : 'text-white/50 hover:text-white hover:bg-white/5'
            )}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={cn('flex-1 overflow-y-auto', desktopMode && 'max-w-none', !desktopMode && 'max-w-lg mx-auto w-full')}>
        {!page && (!activeTab?.url || String(activeTab.url).includes('gulfos.com') || String(activeTab.url) === 'about:blank') ? (
          <NewTabHome onNavigate={goTo} />
        ) : (
          <PageContent page={page} readerMode={readerMode} />
        )}
      </div>

      {/* Tab overview */}
      <AnimatePresence>
        {showTabOverview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-40 bg-black/95 p-4 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold">Tab Overview</h2>
              <button type="button" onClick={() => setShowTabOverview(false)} className="text-white/50">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tabs.map((tab) => (
                <button key={String(tab.tabId)} type="button" onClick={() => { setActiveTabId(String(tab.tabId)); setShowTabOverview(false); }}>
                  <Glass className="p-4 h-28 text-left">
                    <p className="text-white text-sm font-medium truncate">{String(tab.title)}</p>
                    <p className="text-white/40 text-[10px] mt-2 truncate">{String(tab.url)}</p>
                  </Glass>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panels */}
      <AnimatePresence>
        {panel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[70%] bg-black/95 border-t border-white/10 rounded-t-3xl overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold capitalize">{panel === 'menu' ? 'Browser Menu' : panel}</h3>
              <button type="button" onClick={() => { setPanel('none'); setQrData(null); }} className="text-white/50">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {panel === 'bookmarks' && <BookmarksPanel onNavigate={(url) => { goTo(url); setPanel('none'); }} />}
              {panel === 'history' && <HistoryPanel onNavigate={(url) => { goTo(url); setPanel('none'); }} onClear={() => clearHistory.mutate()} />}
              {panel === 'downloads' && <DownloadsPanel />}
              {panel === 'reading' && <ReadingPanel />}
              {panel === 'find' && (
                <div className="space-y-3">
                  <input
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    placeholder="Find in page..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  />
                  <button type="button" onClick={handleFind} className="w-full py-2 bg-red-600 rounded-xl text-white text-sm">Search</button>
                  {findResult && <p className="text-white/60 text-sm">{findResult.matches} matches found</p>}
                  {findResult && <div className="text-white/80 text-sm">{renderMarkdown(findResult.highlights)}</div>}
                </div>
              )}
              {panel === 'qr' && qrData && (
                <div className="text-center">
                  <div
                    role="img"
                    aria-label="QR Code"
                    className="mx-auto w-48 h-48 rounded-xl bg-white"
                    style={{ backgroundImage: `url(${qrData})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
                  />
                  <p className="text-white/50 text-xs mt-3">{addressBar}</p>
                </div>
              )}
              {panel === 'menu' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Bookmarks', icon: '🔖', panel: 'bookmarks' as Panel },
                    { label: 'History', icon: '🕐', panel: 'history' as Panel },
                    { label: 'Downloads', icon: '📥', panel: 'downloads' as Panel },
                    { label: 'Reading List', icon: '📚', panel: 'reading' as Panel },
                    { label: 'Private', icon: '🕶', action: handleIncognito },
                    { label: 'Tabs', icon: '⊞', action: () => { setShowTabOverview(true); setPanel('none'); } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.panel) setPanel(item.panel);
                        else if (item.action) item.action();
                      }}
                      className="text-left"
                    >
                      <Glass className="p-4 hover:bg-white/8 transition-colors">
                        <span className="text-2xl">{item.icon}</span>
                        <p className="text-white text-sm mt-2">{item.label}</p>
                      </Glass>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookmarksPanel({ onNavigate }: { onNavigate: (url: string) => void }) {
  const { data } = useBrowserBookmarks();
  const items = data ?? [];
  return (
    <div className="space-y-2">
      {items.map((b) => (
        <button key={String(b.bookmarkId)} type="button" onClick={() => onNavigate(String(b.url))} className="w-full text-left">
          <Glass className="p-3">
            <p className="text-white text-sm">{String(b.title)}</p>
            <p className="text-white/40 text-xs truncate">{String(b.url)}</p>
          </Glass>
        </button>
      ))}
      {items.length === 0 && <p className="text-white/40 text-center py-8">No bookmarks yet</p>}
    </div>
  );
}

function HistoryPanel({ onNavigate, onClear }: { onNavigate: (url: string) => void; onClear: () => void }) {
  const { data } = useBrowserHistory();
  const items = data ?? [];
  return (
    <div className="space-y-2">
      <button type="button" onClick={onClear} className="w-full py-2 text-red-400 text-xs uppercase tracking-wider">Clear History</button>
      {items.map((h) => (
        <button key={String(h.historyId)} type="button" onClick={() => onNavigate(String(h.url))} className="w-full text-left">
          <Glass className="p-3">
            <p className="text-white text-sm">{String(h.title)}</p>
            <p className="text-white/40 text-xs">{String(h.lastVisitedAt)}</p>
          </Glass>
        </button>
      ))}
    </div>
  );
}

function DownloadsPanel() {
  const { data } = useBrowserDownloads();
  const token = useAuthStore((s) => s.getAccessToken());
  const items = data ?? [];
  return (
    <div className="space-y-2">
      {items.map((d) => (
        <Glass key={String(d.downloadId)} className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white text-sm">{String(d.filename)}</p>
              <p className="text-white/40 text-xs capitalize">{String(d.status)} · {String(d.downloadType)}</p>
            </div>
            <span className="text-gulf-gold text-sm">{Number(d.progress)}%</span>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${Number(d.progress)}%` }} />
          </div>
          {token && String(d.status) === 'downloading' && (
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => browserService.controlDownload(token, String(d.downloadId), 'pause')} className="text-xs text-white/50">Pause</button>
              <button type="button" onClick={() => browserService.controlDownload(token, String(d.downloadId), 'cancel')} className="text-xs text-red-400">Cancel</button>
            </div>
          )}
          {token && String(d.status) === 'paused' && (
            <button type="button" onClick={() => browserService.controlDownload(token, String(d.downloadId), 'resume')} className="text-xs text-green-400 mt-2">Resume</button>
          )}
        </Glass>
      ))}
      {items.length === 0 && <p className="text-white/40 text-center py-8">No downloads</p>}
    </div>
  );
}

function ReadingPanel() {
  const { data } = useBrowserReadingList();
  const items = data ?? [];
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Glass key={String(item.itemId)} className="p-3">
          <p className="text-white text-sm">{String(item.title)}</p>
          <p className="text-white/40 text-xs truncate">{String(item.url)}</p>
        </Glass>
      ))}
      {items.length === 0 && <p className="text-white/40 text-center py-8">Reading list is empty</p>}
    </div>
  );
}
