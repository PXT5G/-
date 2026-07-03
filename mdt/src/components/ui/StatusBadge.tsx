import { cn } from "@/lib/utils/cn";

type BadgeVariant = "green" | "red" | "blue" | "amber" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  green: "border-neon-green/40 bg-neon-green/10 text-neon-green mdt-glow-green",
  red: "border-neon-red/40 bg-neon-red/10 text-neon-red mdt-glow-red",
  blue: "border-neon-blue/40 bg-neon-blue/10 text-neon-blue mdt-glow-blue",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  neutral: "border-slate-600/60 bg-slate-800/60 text-mdt-muted",
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function StatusBadge({ label, variant = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
