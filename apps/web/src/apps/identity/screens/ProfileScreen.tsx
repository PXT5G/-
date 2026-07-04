'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIdentityStore } from '../store/identityStore';
import { identityService } from '../services/identityService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function ProfileScreen() {
  const { identity, setIdentity } = useIdentityStore();
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    biography: identity?.biography ?? '',
    organization: identity?.organization ?? '',
    department: identity?.department ?? '',
    role: identity?.role ?? '',
    additionalInfo: identity?.additionalInfo ?? '',
  });

  const { data: stats } = useQuery({
    queryKey: ['identity', 'stats'],
    queryFn: () => identityService.getStats(),
    enabled: !!identity,
  });

  const { data: history } = useQuery({
    queryKey: ['identity', 'history'],
    queryFn: () => identityService.getHistory(),
    enabled: !!identity,
  });

  const updateMutation = useMutation({
    mutationFn: () => identityService.update(form),
    onSuccess: (data) => {
      setIdentity(data);
      setEditing(false);
      success();
      queryClient.invalidateQueries({ queryKey: ['identity'] });
    },
  });

  if (!identity) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="h-24 bg-gradient-to-r from-banana-gold/20 to-black relative">
        {identity.banner && (
          <img src={identity.banner} alt="" className="w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full border-2 border-banana-gold bg-black flex items-center justify-center text-2xl overflow-hidden">
            {identity.photo ? (
              <img src={identity.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              identity.fullName.charAt(0)
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-10 pb-4">
        <h2 className="text-white font-bold text-lg">{identity.fullName}</h2>
        <p className="text-banana-gold text-sm">@{identity.username}</p>
        <p className="text-white/40 text-xs mt-1">{identity.nationalId}</p>

        {identity.biography && !editing && (
          <p className="text-white/60 text-sm mt-3">{identity.biography}</p>
        )}

        <div className="flex flex-wrap gap-1 mt-3">
          {identity.badges.map((b) => (
            <span key={b} className="px-2 py-0.5 bg-banana-gold/20 text-banana-gold text-xs rounded-full">
              {b}
            </span>
          ))}
        </div>

        {identity.achievements.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-white/40 uppercase mb-1">Achievements</p>
            <div className="flex flex-wrap gap-1">
              {identity.achievements.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full">
                  🏆 {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              ['Organization', identity.organization ?? '—'],
              ['Department', identity.department ?? '—'],
              ['Role', identity.role ?? '—'],
              ['Level', identity.membershipLevel.toUpperCase()],
            ].map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-lg p-2">
                <p className="text-[9px] text-white/40">{k}</p>
                <p className="text-xs text-white">{v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white font-medium">Edit Profile</p>
            <button
              type="button"
              onClick={() => { tap(); setEditing(!editing); }}
              className="text-banana-gold text-xs"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing && (
            <div className="space-y-2">
              {(['biography', 'organization', 'department', 'role', 'additionalInfo'] as const).map((key) => (
                <textarea
                  key={key}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  rows={key === 'biography' ? 3 : 1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-banana-gold/50 resize-none"
                />
              ))}
              <Button
                label="Save Changes"
                onClick={() => { tap(); updateMutation.mutate(); }}
                loading={updateMutation.isPending}
                fullWidth
              />
            </div>
          )}
        </div>

        {history && history.length > 0 && (
          <div className="mt-5">
            <p className="text-sm text-white font-medium mb-2">Activity</p>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs text-white capitalize">{h.action.replace(/_/g, ' ')}</p>
                    {h.field && <p className="text-[10px] text-white/40">{h.field}</p>}
                  </div>
                  <p className="text-[10px] text-white/30">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
