export function BananaLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BananaOS Logo"
    >
      <rect width="64" height="64" rx="16" fill="url(#banana-gradient)" />
      <path
        d="M32 12C28 12 24 16 22 22C20 28 20 36 22 42C24 48 28 52 32 52C36 52 40 48 42 42C44 36 44 28 42 22C40 16 36 12 32 12Z"
        fill="#D4AF37"
        opacity="0.9"
      />
      <path
        d="M32 14C30 14 28 16 27 20C26 24 26 32 27 38C28 42 30 44 32 44"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 16C26 18 25 22 25 26"
        stroke="#2D5016"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x="32"
        y="58"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui"
      >
        OS
      </text>
      <defs>
        <linearGradient id="banana-gradient" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#2D2D2D" />
        </linearGradient>
      </defs>
    </svg>
  );
}
