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
    <div className={cn('flex items-center gap-[6px] rounded-[12px] bg-[rgba(118,118,128,0.24)] px-[8px] h-[36px]', className)}>
      {/* SF magnifying glass */}
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" className="text-[rgba(235,235,245,0.6)] shrink-0" aria-hidden>
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="flex-1 bg-transparent text-[17px] text-white placeholder:text-[rgba(235,235,245,0.6)] outline-none"
      />
      {value && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-[17px] h-[17px] rounded-full bg-[rgba(235,235,245,0.35)] flex items-center justify-center text-black shrink-0"
          aria-label="Clear"
        >
          <svg width="7" height="7" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
