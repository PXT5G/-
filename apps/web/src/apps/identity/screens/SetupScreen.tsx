'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useIdentityStore } from '../store/identityStore';
import { identityService } from '../services/identityService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { tap, success } = useHaptic();
  const [form, setForm] = useState({
    fullName: user?.displayName ?? '',
    username: user?.username ?? '',
    country: 'Banana Republic',
    organization: '',
    department: '',
    role: '',
    biography: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    tap();
    setLoading(true);
    setError('');
    try {
      const identity = await identityService.create({
        fullName: form.fullName,
        username: form.username,
        country: form.country,
        organization: form.organization || undefined,
        department: form.department || undefined,
        role: form.role || undefined,
        biography: form.biography || undefined,
        emergencyContact:
          form.emergencyName && form.emergencyPhone
            ? {
                name: form.emergencyName,
                phone: form.emergencyPhone,
                relationship: form.emergencyRelationship || 'Contact',
              }
            : undefined,
      });
      useIdentityStore.getState().setIdentity(identity);
      success();
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create identity');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div key={key}>
      <label className="text-[10px] text-white/40 uppercase block mb-1">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-banana-gold/50"
      />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="text-center mb-6">
        <span className="text-5xl">🪪</span>
        <h1 className="text-white font-bold text-xl mt-3">Create Your Identity</h1>
        <p className="text-white/40 text-sm mt-1">Your official BananaOS digital ID</p>
      </div>

      <div className="space-y-3">
        {field('fullName', 'Full Name', 'John Doe')}
        {field('username', 'Username', 'johndoe')}
        {field('country', 'Country', 'Banana Republic')}
        {field('organization', 'Organization', 'Optional')}
        {field('department', 'Department', 'Optional')}
        {field('role', 'Role', 'Optional')}
        {field('biography', 'Biography', 'Tell us about yourself')}
        <p className="text-[10px] text-banana-gold uppercase pt-2">Emergency Contact</p>
        {field('emergencyName', 'Name', 'Emergency contact name')}
        {field('emergencyPhone', 'Phone', '+1 555 0000')}
        {field('emergencyRelationship', 'Relationship', 'Spouse, Parent, etc.')}
      </div>

      {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

      <div className="mt-6">
        <Button label="Create Identity" onClick={handleCreate} loading={loading} fullWidth size="lg" />
      </div>
    </div>
  );
}
