'use client';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className = '', showLabel }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-banana-gold transition-all duration-200 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-white/50 mt-1 text-center">{Math.round(value)}%</p>
      )}
    </div>
  );
}
