'use client';

import { cn } from '@/utils/cn';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  onCancel,
  autoFocus,
  className,
}: SearchBarProps) {
  return (
    <div className={cn('flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2', className)}>
      <span className="text-white/40 text-sm">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
      />
      {value && onCancel && (
        <button type="button" onClick={onCancel} className="text-white/40 text-xs" aria-label="Clear">
          ✕
        </button>
      )}
    </div>
  );
}
