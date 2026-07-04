'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/shared';
import type { PackageManifest } from '../types';

interface PermissionApprovalModalProps {
  manifest: PackageManifest;
  appName: string;
  appIcon: string;
  type: 'install' | 'update';
  onApprove: (approvedPermissions: string[]) => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function PermissionApprovalModal({
  manifest,
  appName,
  appIcon,
  type,
  onApprove,
  onCancel,
}: PermissionApprovalModalProps) {
  const allApproved = [
    ...manifest.requiredPermissions,
    ...manifest.optionalPermissions,
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/70">
      <motion.div
        className="w-full max-h-[85%] overflow-y-auto rounded-t-3xl bg-[#1a1a1a] border-t border-white/10 p-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{appIcon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{type === 'update' ? 'Update' : 'Install'} {appName}</h3>
            <p className="text-xs text-white/50">v{manifest.version} · Requires GULFOS {manifest.requiredGULFOSVersion}+</p>
          </div>
        </div>

        <section className="mb-4">
          <h4 className="text-xs font-semibold text-white/40 uppercase mb-2">Required Permissions</h4>
          {manifest.requiredPermissions.length > 0 ? (
            <div className="space-y-1">
              {manifest.requiredPermissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-gulf-gold">●</span>
                  <span className="capitalize">{p}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">No special permissions required</p>
          )}
        </section>

        {manifest.optionalPermissions.length > 0 && (
          <section className="mb-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase mb-2">Optional Permissions</h4>
            <div className="space-y-1">
              {manifest.optionalPermissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-white/60">
                  <span className="text-white/30">○</span>
                  <span className="capitalize">{p}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Storage required</span>
            <span className="text-white">{formatBytes(manifest.storageRequired)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Internet access</span>
            <span className="text-white">{manifest.internetRequired ? 'Required' : 'Not required'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Background activity</span>
            <span className="text-white">{manifest.backgroundActivity ? 'May run in background' : 'None'}</span>
          </div>
        </section>

        {manifest.dependencies.length > 0 && (
          <section className="mb-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase mb-2">Dependencies</h4>
            <p className="text-sm text-white/60">{manifest.dependencies.join(', ')}</p>
          </section>
        )}

        <div className="flex gap-3 mt-6">
          <Button label="Cancel" variant="ghost" onClick={onCancel} fullWidth />
          <Button
            label={type === 'update' ? 'Update' : 'Install'}
            onClick={() => onApprove(allApproved)}
            fullWidth
          />
        </div>
      </motion.div>
    </div>
  );
}
