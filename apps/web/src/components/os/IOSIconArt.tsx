'use client';

/**
 * Apple-Settings-style squircle icons for GULF-specific apps that have no
 * iOS stock artwork: colored gradient squircle + white glyph (Apple's own
 * pattern for system utilities). Core apps use real iOS 18 PNG artwork
 * via AppIcon's STOCK_ICONS map.
 */

/** iOS squircle path for a 100×100 viewBox */
export const SQUIRCLE_PATH =
  'M 50,0 C 11,0 0,11 0,50 C 0,89 11,100 50,100 C 89,100 100,89 100,50 C 100,11 89,0 50,0 Z';

interface ArtProps {
  size: number;
}

function Tile({
  size,
  gradient,
  children,
}: {
  size: number;
  gradient: [string, string];
  children?: React.ReactNode;
}) {
  const id = `g${gradient[0].replace(/[^a-zA-Z0-9]/g, '')}${gradient[1].replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE_PATH} fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

const ContactsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FFFFFF', '#EDEDF0']}>
    <circle cx="50" cy="40" r="12.5" fill="#9CA0A8" />
    <path d="M27 76c3-13 12.5-20 23-20s20 7 23 20" fill="#9CA0A8" />
  </Tile>
);

const RecorderArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#2C2C2E', '#111113']}>
    {[18, 26, 34, 42, 50, 58, 66, 74, 82].map((x, i) => {
      const heights = [10, 22, 34, 18, 42, 18, 34, 22, 10];
      return <rect key={x} x={x - 1.6} y={50 - heights[i] / 2} width="3.2" height={heights[i]} rx="1.6" fill={i === 4 ? '#FF453A' : 'white'} />;
    })}
  </Tile>
);

const PoliceArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#5C7CFA', '#1A3AA8']}>
    <path d="M50 24l19 7v14c0 13-8 24-19 29-11-5-19-16-19-29V31l19-7z" fill="white" />
    <path d="M50 33l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4L50 54.7l-8.4 4.4 1.6-9.4-6.9-6.7 9.5-1.4L50 33z" fill="#3457D5" />
  </Tile>
);

const JusticeArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#B39DDB', '#5E35B1']}>
    <rect x="47.4" y="26" width="5.2" height="42" rx="2.6" fill="white" />
    <rect x="28" y="32" width="44" height="5" rx="2.5" fill="white" />
    <path d="M33 37l-8 16h16l-8-16z" fill="white" />
    <path d="M25 53a8 8 0 0016 0" fill="none" stroke="white" strokeWidth="3.4" />
    <path d="M67 37l-8 16h16l-8-16z" fill="white" />
    <path d="M59 53a8 8 0 0016 0" fill="none" stroke="white" strokeWidth="3.4" />
    <rect x="38" y="70" width="24" height="5.4" rx="2.7" fill="white" />
  </Tile>
);

const PoetryArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#E8D48B', '#8D6E1E']}>
    <path d="M64 26c-2 10-8 30-26 46" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M62 28c-8 2-14 8-16 16l-3 12c6-1 11-4 14-8" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M36 66c8 0 16-2 22-8" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
  </Tile>
);

const IdentityArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#8E99A8', '#4E5A6B']}>
    <rect x="22" y="30" width="56" height="40" rx="6" fill="white" />
    <circle cx="37" cy="46" r="6.5" fill="#8E99A8" />
    <path d="M27 62c1.8-6 5.7-9 10-9s8.2 3 10 9" fill="#8E99A8" />
    <rect x="54" y="41" width="17" height="3.6" rx="1.8" fill="#AEB6C2" />
    <rect x="54" y="49" width="17" height="3.6" rx="1.8" fill="#AEB6C2" />
    <rect x="54" y="57" width="12" height="3.6" rx="1.8" fill="#AEB6C2" />
  </Tile>
);

/** iOS Settings — dual-ring gray gear */
const SettingsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#C8C9CE', '#88898F']}>
    <circle cx="50" cy="50" r="30" fill="#4A4B51" />
    {Array.from({ length: 18 }).map((_, i) => (
      <rect key={i} x="47.2" y="16.5" width="5.6" height="9" rx="1.6" fill="#D9DADF" transform={`rotate(${i * 20} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="24" fill="#D9DADF" />
    <circle cx="50" cy="50" r="17" fill="#5B5C63" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x="48" y="34.5" width="4" height="6.5" rx="1.3" fill="#D9DADF" transform={`rotate(${i * 30} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="10.5" fill="#D9DADF" />
    <circle cx="50" cy="50" r="5" fill="#77787E" />
  </Tile>
);

/** App Store — white "A" triangle on blue gradient */
const StoreArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#41C7F4', '#1173E9']}>
    <path d="M36 74l22-38M64 74l-6.5-11" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M50 30l11.3 19.6H38.7L50 30z" fill="none" stroke="white" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M30 62h40" stroke="white" strokeWidth="7" strokeLinecap="round" />
  </Tile>
);

const ART: Record<string, (p: ArtProps) => React.ReactElement> = {
  'com.gulfos.contacts': ContactsArt,
  'com.gulfos.recorder': RecorderArt,
  'com.gulfos.police': PoliceArt,
  'com.gulfos.justice': JusticeArt,
  'com.gulfos.poetry': PoetryArt,
  'com.gulfos.identity': IdentityArt,
  'com.gulfos.settings': SettingsArt,
  'com.gulfos.store': StoreArt,
};

/** Settings-style gradient per remaining GULF app */
const FALLBACK_GRADIENTS: Record<string, [string, string]> = {
  'com.gulfos.business': ['#90A4AE', '#37474F'],
  'com.gulfos.real-estate': ['#80CBC4', '#00695C'],
  'com.gulfos.vehicles': ['#EF9A9A', '#B71C1C'],
  'com.gulfos.aviation': ['#90CAF9', '#0D47A1'],
  'com.gulfos.marine': ['#4DD0E1', '#006064'],
  'com.gulfos.exchange': ['#69F0AE', '#00897B'],
  'com.gulfos.sim': ['#FFD54F', '#F57F17'],
  'com.gulfos.assistant': ['#B388FF', '#4527A0'],
  'com.gulfos.automation': ['#FFAB91', '#BF360C'],
  'com.gulfos.shortcuts': ['#82B1FF', '#1565C0'],
  'com.gulfos.focus': ['#CE93D8', '#6A1B9A'],
  'com.gulfos.intelligence': ['#F48FB1', '#AD1457'],
  'com.gulfos.personalization': ['#FFE082', '#FF8F00'],
  'com.gulfos.security': ['#A5D6A7', '#1B5E20'],
  'com.gulfos.privacy': ['#90CAF9', '#1565C0'],
  'com.gulfos.cloud': ['#81D4FA', '#0277BD'],
  'com.gulfos.developer': ['#616161', '#212121'],
  'com.gulfos.analytics': ['#9FA8DA', '#283593'],
  'com.gulfos.diagnostics': ['#FFCC80', '#E65100'],
  'com.gulfos.enterprise': ['#B0BEC5', '#37474F'],
  'com.gulfos.performance': ['#FFF59D', '#F9A825'],
  'com.gulfos.updates': ['#80DEEA', '#00838F'],
};

export function IOSIconArt({ bundleId, emoji, size }: { bundleId?: string; emoji: string; size: number }) {
  if (bundleId && ART[bundleId]) {
    const Art = ART[bundleId];
    return <Art size={size} />;
  }
  const gradient: [string, string] = (bundleId ? FALLBACK_GRADIENTS[bundleId] : undefined) ?? ['#3A3A3C', '#1C1C1E'];
  return (
    <Tile size={size} gradient={gradient}>
      <text x="50" y="63" textAnchor="middle" fontSize="40">{emoji}</text>
    </Tile>
  );
}
