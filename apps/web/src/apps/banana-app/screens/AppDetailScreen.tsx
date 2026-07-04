'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { bananaAppService } from '../services/bananaAppService';
import type { AppVersionInfo, StoreReview } from '../types';
import { Button, RatingStars } from '@/components/shared';
import { useHaptic, useSound } from '@/hooks/useSound';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

interface AppDetailScreenProps {
  bundleId: string;
  onBack: () => void;
  onInstall: (bundleId: string) => void;
  onUpdate: (bundleId: string) => void;
  onDeveloper: (slug: string) => void;
}

export function AppDetailScreen({ bundleId, onBack, onInstall, onUpdate, onDeveloper }: AppDetailScreenProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');

  const { tap, success } = useHaptic();
  const { playTap } = useSound();
  const { isAuthenticated, login } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ['store', 'app', bundleId],
    queryFn: () => bananaAppService.getAppDetail(bundleId),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      bananaAppService.postReview(bundleId, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      }),
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewBody('');
      queryClient.invalidateQueries({ queryKey: ['store', 'app', bundleId] });
      success();
    },
  });

  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === 'register') {
        return authService.register({
          username: authUsername,
          email: authEmail,
          password: authPassword,
        });
      }
      return authService.login({ email: authEmail, password: authPassword });
    },
    onSuccess: (data) => {
      login(data.user, data.tokens);
      setAuthMode(null);
      success();
    },
  });

  const formatSize = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

  const handleInstall = () => {
    playTap();
    if (!isAuthenticated) {
      setAuthMode('login');
      return;
    }
    if (app?.installed && app.hasUpdate) {
      onUpdate(bundleId);
    } else if (!app?.installed) {
      onInstall(bundleId);
    }
  };

  if (isLoading || !app) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm">
          ‹ Back
        </button>
        <h1 className="text-sm font-semibold text-white flex-1 truncate">{app.name}</h1>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-4">
        {/* Header */}
        <div className="flex gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-4xl shrink-0">
            {app.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {app.name}
              {app.verified && <span className="text-banana-gold text-sm">✓ Official</span>}
            </h2>
            <p className="text-sm text-banana-gold">{app.tagline}</p>
            <div className="mt-1">
              <RatingStars rating={app.ratingAverage} showValue count={app.ratingCount} />
            </div>
            <p className="text-xs text-white/40 mt-1">
              {app.downloadCount.toLocaleString()} downloads · {formatSize(app.storageSize)}
            </p>
          </div>
        </div>

        {/* Screenshots */}
        {app.screenshots.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
            {app.screenshots.map((s: string, i: number) => (
              <div
                key={i}
                className="flex-shrink-0 w-40 h-28 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl"
              >
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Install button */}
        <Button
          label={
            app.installed
              ? app.hasUpdate
                ? 'Update'
                : 'Installed'
              : app.price > 0
                ? `Get — ${app.currency} ${app.price}`
                : 'Install'
          }
          onClick={handleInstall}
          disabled={app.installed && !app.hasUpdate}
          fullWidth
          className="mb-6"
        />

        {/* Description */}
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-white/40 uppercase mb-2">About</h3>
          <p className="text-sm text-white/80 leading-relaxed">{app.longDescription || app.description}</p>
        </section>

        {/* Developer */}
        {app.developer && (
          <button
            type="button"
            onClick={() => app.developer?.slug && onDeveloper(app.developer.slug)}
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/10 mb-6 text-left"
          >
            <span className="text-2xl">{app.developer.logo}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{app.developer.name}</p>
              <p className="text-xs text-white/50">Developer</p>
            </div>
            {app.developer.verified && <span className="text-banana-gold text-xs">✓</span>}
            <span className="text-white/30">›</span>
          </button>
        )}

        {/* Permissions */}
        {app.permissions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase mb-2">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {app.permissions.map((p: string) => (
                <span key={p} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 capitalize">
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Version history */}
        {app.versions && app.versions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase mb-2">Version History</h3>
            {app.versions.map((v: AppVersionInfo) => (
              <div key={v.version} className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-white">v{v.version}</p>
                  <p className="text-xs text-white/40">{new Date(v.releaseDate).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-white/60 mt-1">{v.changelog}</p>
              </div>
            ))}
          </section>
        )}

        {/* Reviews */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase">Reviews</h3>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-xs text-banana-gold"
              >
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)} className={s <= reviewRating ? 'text-banana-gold' : 'text-white/20'}>
                    ★
                  </button>
                ))}
              </div>
              <input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
              />
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Your review"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none resize-none"
              />
              <Button
                label="Submit Review"
                size="sm"
                onClick={() => reviewMutation.mutate()}
                loading={reviewMutation.isPending}
                disabled={!reviewTitle || !reviewBody}
              />
            </div>
          )}

          {app.reviews && app.reviews.length > 0 ? (
            app.reviews.map((r: StoreReview) => (
              <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white">{r.username}</p>
                  <RatingStars rating={r.rating} size="sm" />
                </div>
                <p className="text-sm font-medium text-white/80">{r.title}</p>
                <p className="text-xs text-white/60 mt-1">{r.body}</p>
                <p className="text-[10px] text-white/30 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No reviews yet</p>
          )}
        </section>
      </motion.div>

      {/* Auth modal */}
      {authMode && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/60">
          <div className="w-full p-6 rounded-t-3xl bg-[#1a1a1a] border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              {authMode === 'login' ? 'Sign In to Install' : 'Create Account'}
            </h3>
            {authMode === 'register' && (
              <input
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Username"
                className="w-full mb-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            )}
            <input
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full mb-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
            />
            <input
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full mb-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
            />
            <Button
              label={authMode === 'login' ? 'Sign In' : 'Create Account'}
              onClick={() => authMutation.mutate()}
              loading={authMutation.isPending}
              fullWidth
            />
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="w-full mt-3 text-sm text-banana-gold text-center"
            >
              {authMode === 'login' ? 'Create an account' : 'Already have an account?'}
            </button>
            <button type="button" onClick={() => setAuthMode(null)} className="w-full mt-2 text-sm text-white/40 text-center">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
