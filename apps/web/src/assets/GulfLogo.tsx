export function GulfLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GULFOS Logo"
    >
      <rect width="64" height="64" rx="16" fill="url(#gulf-gradient)" />
      <path
        d="M8 40C16 36 24 38 32 34C40 30 48 32 56 28V48C48 52 40 50 32 54C24 58 16 56 8 60V40Z"
        fill="#D4AF37"
        opacity="0.85"
      />
      <circle cx="48" cy="18" r="8" fill="#D4AF37" opacity="0.9" />
      <text
        x="32"
        y="58"
        textAnchor="middle"
        fill="white"
        fontSize="7"
        fontWeight="bold"
        fontFamily="system-ui"
      >
        GULF
      </text>
      <defs>
        <linearGradient id="gulf-gradient" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#1A2A3A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
