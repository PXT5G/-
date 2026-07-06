'use client';

import { cn } from '@/utils/cn';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/* iOS button styles: filled / gray / plain / destructive-filled */
const variants = {
  primary: 'bg-gulf-gold text-black font-semibold active:opacity-80',
  secondary: 'bg-[rgba(120,120,128,0.24)] text-white active:bg-[rgba(120,120,128,0.36)]',
  ghost: 'bg-transparent text-gulf-gold active:opacity-50',
  destructive: 'bg-ios-red text-white font-semibold active:opacity-80',
};

/* iOS control sizes: small 28pt, medium 34pt, large 50pt */
const sizes = {
  sm: 'px-[14px] h-[28px] text-[15px] rounded-[14px]',
  md: 'px-4 h-[34px] text-[15px] rounded-[17px]',
  lg: 'px-5 h-[50px] text-[17px] rounded-[14px]',
};

export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth,
  className,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {label}
    </button>
  );
}
