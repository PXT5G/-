'use client';

import { cn } from '@/utils/cn';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Slider({ value, onChange, min = 0, max = 100, label, icon, className }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {icon && <span className="text-white/70 shrink-0">{icon}</span>}
      <div className="flex-1 relative">
        {label && (
          <span className="sr-only">{label}</span>
        )}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="w-full h-1 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-white/20
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:-mt-2
            [&::-webkit-slider-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-banana-gold) ${percentage}%, transparent ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
