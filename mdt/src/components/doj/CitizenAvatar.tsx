import { cn } from "@/lib/utils/cn";

const GRADIENTS = [
  "from-blue-600 to-cyan-500",
  "from-violet-600 to-purple-500",
  "from-emerald-600 to-teal-500",
  "from-amber-600 to-orange-500",
  "from-rose-600 to-pink-500",
];

function gradientForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CitizenAvatar({
  seed,
  name,
  size = "md",
}: {
  seed: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-10 w-10 text-xs",
    md: "h-14 w-14 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-xl",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg",
        gradientForSeed(seed),
        sizes[size],
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
