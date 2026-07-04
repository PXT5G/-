'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function AdminCard({ children, className = '', accent }: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border backdrop-blur-xl p-4 ${
        accent
          ? 'bg-gradient-to-br from-banana-gold/10 via-white/5 to-transparent border-banana-gold/25'
          : 'bg-white/[0.03] border-white/10'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
}

export function StatTile({ label, value, icon, trend }: StatTileProps) {
  return (
    <AdminCard className="text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-[9px] text-white/40 uppercase tracking-widest">{label}</p>
      {trend && <p className="text-[9px] text-banana-gold mt-1">{trend}</p>}
    </AdminCard>
  );
}

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  maxBars?: number;
}

export function BarChart({ data, maxBars = 8 }: BarChartProps) {
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[9px] text-white/40 w-24 truncate">{item.label}</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="h-full bg-gradient-to-r from-banana-gold/80 to-banana-gold/40 rounded-full"
            />
          </div>
          <span className="text-[9px] text-white/50 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
