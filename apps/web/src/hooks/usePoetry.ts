'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { poetryService } from '@/services/poetryService';

export function usePoetryInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    poetryService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function usePoetrySocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'poetry:initialized', 'poetry:poem:new', 'poetry:poem:update', 'poetry:poem:published',
      'poetry:comment:new', 'poetry:like', 'poetry:announcement', 'poetry:moderation',
      'poetry:event:update', 'poetry:trending:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['poetry'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function usePoetryHome() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'home'],
    queryFn: () => poetryService.getHome(token!),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });
}

export function usePoetryPoems(params?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'poems', params],
    queryFn: () => poetryService.listPoems(token!, params),
    enabled: Boolean(token),
  });
}

export function usePoetryPoem(poemId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'poem', poemId],
    queryFn: () => poetryService.getPoem(token!, poemId!),
    enabled: Boolean(token && poemId),
  });
}

export function usePoetrySearch(query: string, sort?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'search', query, sort],
    queryFn: () => poetryService.search(token!, { q: query, sort: sort ?? '' }),
    enabled: Boolean(token && query.length > 0),
  });
}

export function usePoetryBookmarks() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'bookmarks'],
    queryFn: () => poetryService.getBookmarks(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryFavorites() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'favorites'],
    queryFn: () => poetryService.getFavorites(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryHistory() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'history'],
    queryFn: () => poetryService.getHistory(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryProfile(userId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'profile', userId],
    queryFn: () => poetryService.getProfile(token!, userId!),
    enabled: Boolean(token && userId),
  });
}

export function usePoetryVerifiedPoets() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'verified'],
    queryFn: () => poetryService.getVerifiedPoets(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryCollections() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'collections'],
    queryFn: () => poetryService.getCollections(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryEvents() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'events'],
    queryFn: () => poetryService.getEvents(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryCompetitions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'competitions'],
    queryFn: () => poetryService.getCompetitions(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryChallenges() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'challenges'],
    queryFn: () => poetryService.getChallenges(token!),
    enabled: Boolean(token),
  });
}

export function usePoetryAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['poetry', 'analytics'],
    queryFn: () => poetryService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useCreatePoem() {
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => poetryService.createPoem(token!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poetry'] }),
  });
}

export function useUpdatePoem(poemId: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => poetryService.updatePoem(token!, poemId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poetry'] }),
  });
}

export function useLikePoem() {
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poemId: string) => poetryService.likePoem(token!, poemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poetry'] }),
  });
}

export function usePoetryComment(poemId: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => poetryService.addComment(token!, poemId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poetry', 'poem', poemId] }),
  });
}

export function usePoetryRandom() {
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => poetryService.getRandom(token!),
    onSuccess: (data) => {
      qc.setQueryData(['poetry', 'random'], data);
    },
  });
}
