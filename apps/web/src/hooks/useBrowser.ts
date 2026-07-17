'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { browserService } from '@/services/browserService';

export function useBrowserInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['browser', 'init'],
    queryFn: () => browserService.initialize(token!),
    enabled: Boolean(isAuthenticated && token),
    staleTime: 60_000,
  });
}

export function useBrowserSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'browser:initialized', 'browser:tab:update', 'browser:tab:sync',
      'browser:download:progress', 'browser:download:complete',
      'browser:history:update', 'browser:bookmark:update', 'browser:session:sync',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['browser'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useBrowserHome() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'home'],
    queryFn: () => browserService.getHome(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserSites() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'sites'],
    queryFn: () => browserService.listSites(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserBookmarks() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'bookmarks'],
    queryFn: () => browserService.listBookmarks(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserHistory() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'history'],
    queryFn: () => browserService.listHistory(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserDownloads() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'downloads'],
    queryFn: () => browserService.listDownloads(token!),
    enabled: Boolean(token),
    refetchInterval: 2000,
  });
}

export function useBrowserReadingList() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'reading-list'],
    queryFn: () => browserService.listReadingList(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserNavigate() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { tabId: string; url: string }) => browserService.navigate(token!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useBrowserCreateTab() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, url }: { sessionId: string; url?: string }) =>
      browserService.createTab(token!, sessionId, url),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useBrowserCloseTab() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tabId: string) => browserService.closeTab(token!, tabId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useBrowserAddBookmark() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { url: string; title: string; favorite?: boolean }) =>
      browserService.addBookmark(token!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser', 'bookmarks'] }),
  });
}

export function useBrowserStartDownload() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { url: string; filename: string; mimeType?: string }) =>
      browserService.startDownload(token!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser', 'downloads'] }),
  });
}

export function useBrowserIncognito() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => browserService.createSession(token!, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useBrowserClearHistory() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => browserService.clearHistory(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser', 'history'] }),
  });
}

export function useBrowserSearch(query: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['browser', 'search', query],
    queryFn: () => browserService.search(token!, query),
    enabled: Boolean(token && query.length > 1),
  });
}
