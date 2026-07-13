'use client';

import { useEffect, useState } from 'react';

/**
 * Authentic iOS-style app icon artwork.
 * Squircle (superellipse) tiles with Apple-grade gradients, drawn SVG glyphs,
 * top gloss and inner contrast — matching real iPhone icons.
 */

/** iOS squircle path for a 100×100 viewBox (superellipse approximation) */
export const SQUIRCLE_PATH =
  'M 50,0 C 11,0 0,11 0,50 C 0,89 11,100 50,100 C 89,100 100,89 100,50 C 100,11 89,0 50,0 Z';

interface ArtProps {
  size: number;
}

function Tile({
  size,
  gradient,
  children,
  gloss = true,
}: {
  size: number;
  gradient: [string, string];
  children: React.ReactNode;
  gloss?: boolean;
}) {
  const id = `g${gradient[0].replace(/[^a-zA-Z0-9]/g, '')}${gradient[1].replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE_PATH} fill={`url(#${id})`} />
      {children}
      {gloss && <path d={SQUIRCLE_PATH} fill={`url(#${id}-gloss)`} opacity="0.55" style={{ clipPath: 'inset(0 0 55% 0)' }} />}
    </svg>
  );
}

/* ── Individual icon artworks ─────────────────────────────────────────────── */

const PhoneArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#5DE884', '#0EBC41']}>
    <path
      d="M31 26c-3 3-4.5 7-3 11 3 9 8 17 15 24s15 12 24 15c4 1.5 8 0 11-3l4-4c2-2 2-5 0-7l-8-7c-2-1.7-4.8-1.7-6.7 0l-2.6 2.3c-1.5 1.3-3.7 1.5-5.3.3a55 55 0 01-12-12c-1.2-1.6-1-3.8.3-5.3l2.3-2.6c1.7-1.9 1.7-4.7 0-6.7l-7-8c-2-2-5-2-7 0l-4 4z"
      fill="white"
    />
  </Tile>
);

const MessagesArt = ({ size, color = ['#6BE07C', '#1EAD38'] as [string, string] }: ArtProps & { color?: [string, string] }) => (
  <Tile size={size} gradient={color}>
    <path
      d="M50 24c-15.5 0-28 10.3-28 23 0 7.2 4 13.6 10.3 17.8-.4 3.4-1.8 6.7-4.3 9.2 4.6-.4 8.9-2.2 12.2-4.7 3 .8 6.4 1.2 9.8 1.2 15.5 0 28-10.3 28-23S65.5 24 50 24z"
      fill="white"
    />
  </Tile>
);

const MailArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#5FC9F8', '#1D77EF']}>
    <rect x="20" y="30" width="60" height="42" rx="7" fill="white" />
    <path d="M22 34l28 20 28-20" stroke="#1D77EF" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Tile>
);

const CameraArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#585B63', '#23252B']}>
    <rect x="18" y="32" width="64" height="40" rx="9" fill="#D8D9DE" />
    <path d="M38 32l4-7h16l4 7z" fill="#D8D9DE" />
    <circle cx="50" cy="52" r="14.5" fill="#23252B" />
    <circle cx="50" cy="52" r="10" fill="#3D6FF0" />
    <circle cx="50" cy="52" r="10" fill="url(#camlens)" />
    <defs>
      <radialGradient id="camlens" cx="0.35" cy="0.3" r="1">
        <stop offset="0%" stopColor="#8FB5FF" />
        <stop offset="60%" stopColor="#2B54C4" />
        <stop offset="100%" stopColor="#101E4A" />
      </radialGradient>
    </defs>
    <circle cx="46.5" cy="47.5" r="3" fill="rgba(255,255,255,0.75)" />
    <circle cx="72" cy="38" r="2.4" fill="#F2C94C" />
  </Tile>
);

const PhotosArt = ({ size }: ArtProps) => {
  const petals = Array.from({ length: 8 });
  const colors = ['#F9CE31', '#F5A623', '#EE6C4D', '#E64980', '#9B5DE5', '#3D8BFD', '#38C6D9', '#7BC950'];
  return (
    <Tile size={size} gradient={['#FDFDFD', '#E9E9EE']} gloss={false}>
      {petals.map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const cx = 50 + 15 * Math.cos(a);
        const cy = 50 + 15 * Math.sin(a);
        return <ellipse key={i} cx={cx} cy={cy} rx="13" ry="8.2" fill={colors[i]} opacity="0.82" transform={`rotate(${i * 45} ${cx} ${cy})`} />;
      })}
    </Tile>
  );
};

const MapsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#D8EFD5', '#B7E3BC']} gloss={false}>
    <rect x="0" y="0" width="100" height="100" fill="none" />
    <path d="M0 62 Q30 52 52 60 T100 55 V100 H0 Z" fill="#F7E9C0" />
    <path d="M0 30 Q25 42 55 34 T100 40" stroke="#FFFFFF" strokeWidth="7" fill="none" />
    <path d="M28 0 Q34 30 26 58 T36 100" stroke="#F5B944" strokeWidth="6.5" fill="none" />
    <path d="M60 0 Q66 25 82 38 T100 48" stroke="#8FC9F2" strokeWidth="10" fill="none" opacity="0.9" />
    <circle cx="42" cy="44" r="7.5" fill="#3D8BFD" stroke="white" strokeWidth="2.6" />
  </Tile>
);

const FilesArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FDFDFD', '#ECECF1']} gloss={false}>
    <path d="M24 34c0-2.8 2.2-5 5-5h13l6 6h23c2.8 0 5 2.2 5 5v26c0 2.8-2.2 5-5 5H29c-2.8 0-5-2.2-5-5V34z" fill="#3B9CF7" />
    <path d="M24 42h52v24c0 2.8-2.2 5-5 5H29c-2.8 0-5-2.2-5-5V42z" fill="#6DB9FB" />
  </Tile>
);

const BrowserArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FFFFFF', '#EDEDF2']} gloss={false}>
    <circle cx="50" cy="50" r="31" fill="url(#safbg)" />
    <defs>
      <radialGradient id="safbg" cx="0.5" cy="0.42" r="0.75">
        <stop offset="0%" stopColor="#3EC6F0" />
        <stop offset="55%" stopColor="#1D8DE8" />
        <stop offset="100%" stopColor="#1266C8" />
      </radialGradient>
    </defs>
    {Array.from({ length: 72 }).map((_, i) => {
      const a = (i * 5 * Math.PI) / 180;
      const long = i % 3 === 0;
      const r1 = long ? 26.5 : 28.5;
      return (
        <line
          key={i}
          x1={50 + r1 * Math.cos(a)}
          y1={50 + r1 * Math.sin(a)}
          x2={50 + 30.4 * Math.cos(a)}
          y2={50 + 30.4 * Math.sin(a)}
          stroke="white"
          strokeWidth={long ? 1 : 0.6}
          opacity="0.9"
        />
      );
    })}
    <path d="M64 36 L45.5 45.5 36 64l18.5-9.5z" fill="white" />
    <path d="M64 36 L54.5 54.5 36 64l9.5-18.5z" fill="#FF3B30" />
  </Tile>
);

const SettingsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#C8C9CE', '#88898F']} gloss={false}>
    <circle cx="50" cy="50" r="30" fill="#4A4B51" />
    {Array.from({ length: 18 }).map((_, i) => {
      const a = (i * 20 * Math.PI) / 180;
      return (
        <rect
          key={i}
          x="47.2"
          y="16.5"
          width="5.6"
          height="9"
          rx="1.6"
          fill="#D9DADF"
          transform={`rotate(${i * 20} 50 50)`}
        />
      );
    })}
    <circle cx="50" cy="50" r="24" fill="#D9DADF" />
    <circle cx="50" cy="50" r="17" fill="#5B5C63" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x="48" y="34.5" width="4" height="6.5" rx="1.3" fill="#D9DADF" transform={`rotate(${i * 30} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="10.5" fill="#D9DADF" />
    <circle cx="50" cy="50" r="5" fill="#77787E" />
  </Tile>
);

const StoreArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#41C7F4', '#1173E9']}>
    <path d="M50 26l11.3 19.6H38.7L50 26z" fill="none" stroke="white" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" transform="translate(0 4)" />
    <path d="M30 62h40" stroke="white" strokeWidth="7" strokeLinecap="round" transform="rotate(0 50 50)" />
    <path d="M36 74l22-38M64 74l-6.5-11" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
  </Tile>
);

const ClockArt = ({ size }: ArtProps) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
  const m = (now.getMinutes() + now.getSeconds() / 60) * 6;
  const s = now.getSeconds() * 6;
  return (
    <Tile size={size} gradient={['#1C1C1E', '#000000']} gloss={false}>
      <circle cx="50" cy="50" r="34" fill="white" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="49" y="18.5" width="2" height="7" rx="1" fill="#111" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line x1="50" y1="50" x2={50 + 16 * Math.sin((h * Math.PI) / 180)} y2={50 - 16 * Math.cos((h * Math.PI) / 180)} stroke="#111" strokeWidth="3.6" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + 24 * Math.sin((m * Math.PI) / 180)} y2={50 - 24 * Math.cos((m * Math.PI) / 180)} stroke="#111" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="50" y1="53" x2={50 + 26 * Math.sin((s * Math.PI) / 180)} y2={50 - 26 * Math.cos((s * Math.PI) / 180)} stroke="#FF9500" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2.2" fill="#FF9500" />
    </Tile>
  );
};

const CalculatorArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#2C2C2E', '#0E0E10']} gloss={false}>
    {[
      { x: 26, y: 26, c: '#A5A5A8' }, { x: 42, y: 26, c: '#A5A5A8' }, { x: 58, y: 26, c: '#FF9F0A' },
      { x: 26, y: 42, c: '#59595E' }, { x: 42, y: 42, c: '#59595E' }, { x: 58, y: 42, c: '#FF9F0A' },
      { x: 26, y: 58, c: '#59595E' }, { x: 42, y: 58, c: '#59595E' }, { x: 58, y: 58, c: '#FF9F0A' },
    ].map((b, i) => (
      <circle key={i} cx={b.x + 8} cy={b.y + 8} r="7" fill={b.c} />
    ))}
  </Tile>
);

const NotesArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FFFFFF', '#F2F2F4']} gloss={false}>
    <path d={SQUIRCLE_PATH} fill="white" />
    <path d="M0 0 h100 v26 H0 Z" fill="#F7C948" style={{ clipPath: `path('${SQUIRCLE_PATH}')` }} />
    {[40, 54, 68].map((y) => (
      <line key={y} x1="22" y1={y} x2="78" y2={y} stroke="#D3D3D8" strokeWidth="3" strokeLinecap="round" />
    ))}
    {[26, 41.5, 57, 72.5].map((x) => (
      <circle key={x} cx={x + 2} cy="13" r="2.6" fill="#B98E10" opacity="0.85" />
    ))}
  </Tile>
);

const WeatherArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#4A90E2', '#1B5FBF']}>
    <circle cx="38" cy="38" r="13" fill="#FFD60A" />
    <g fill="white">
      <circle cx="52" cy="56" r="12" />
      <circle cx="64" cy="52" r="9.5" />
      <circle cx="41" cy="58" r="9" />
      <rect x="32" y="56" width="41" height="12" rx="6" />
    </g>
  </Tile>
);

const CalendarArt = ({ size }: ArtProps) => {
  const [now] = useState(new Date());
  const day = now.getDate();
  const wk = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return (
    <Tile size={size} gradient={['#FFFFFF', '#F0F0F3']} gloss={false}>
      <text x="50" y="34" textAnchor="middle" fontSize="13" fontWeight="600" fill="#FF3B30" fontFamily="SF Pro Display, sans-serif">{wk}</text>
      <text x="50" y="74" textAnchor="middle" fontSize="42" fontWeight="300" fill="#1C1C1E" fontFamily="SF Pro Display, sans-serif">{day}</text>
    </Tile>
  );
};

const ContactsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FFFFFF', '#EDEDF0']} gloss={false}>
    <circle cx="50" cy="40" r="12.5" fill="#9CA0A8" />
    <path d="M27 76c3-13 12.5-20 23-20s20 7 23 20" fill="#9CA0A8" />
    <circle cx="50" cy="40" r="12.5" fill="url(#ctcg)" />
    <defs>
      <linearGradient id="ctcg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B9BEC7" />
        <stop offset="100%" stopColor="#868B94" />
      </linearGradient>
    </defs>
  </Tile>
);

const BankArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#E9D48A', '#A67C00']}>
    <path d="M50 26L26 40h48L50 26z" fill="white" />
    <rect x="28" y="44" width="6" height="20" fill="white" />
    <rect x="41" y="44" width="6" height="20" fill="white" />
    <rect x="54" y="44" width="6" height="20" fill="white" />
    <rect x="67" y="44" width="6" height="20" fill="white" />
    <rect x="24" y="67" width="52" height="7" rx="2" fill="white" />
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

const RecorderArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#2C2C2E', '#111113']} gloss={false}>
    {[18, 26, 34, 42, 50, 58, 66, 74, 82].map((x, i) => {
      const heights = [10, 22, 34, 18, 42, 18, 34, 22, 10];
      return <rect key={x} x={x - 1.6} y={50 - heights[i] / 2} width="3.2" height={heights[i]} rx="1.6" fill={i === 4 ? '#FF453A' : 'white'} />;
    })}
  </Tile>
);

const ChatArt = ({ size }: ArtProps) => <MessagesArt size={size} color={['#6BD5FF', '#157EFB']} />;

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

const EmsArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#FF8A80', '#C62828']}>
    <rect x="42" y="28" width="16" height="44" rx="5" fill="white" />
    <rect x="28" y="42" width="44" height="16" rx="5" fill="white" />
  </Tile>
);

const PoetryArt = ({ size }: ArtProps) => (
  <Tile size={size} gradient={['#E8D48B', '#8D6E1E']}>
    <path d="M62 28c-8 2-14 8-16 16l-3 12c6-1 11-4 14-8" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M64 26c-2 10-8 30-26 46" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M36 66c8 0 16-2 22-8" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
  </Tile>
);

const DefaultArt = ({ size, emoji, gradient }: ArtProps & { emoji: string; gradient: [string, string] }) => (
  <Tile size={size} gradient={gradient}>
    <text x="50" y="63" textAnchor="middle" fontSize="40">{emoji}</text>
  </Tile>
);

/* ── Registry ─────────────────────────────────────────────────────────────── */

const ART: Record<string, (p: ArtProps) => React.ReactElement> = {
  'com.gulfos.phone': PhoneArt,
  'com.gulfos.messages': MessagesArt,
  'com.gulfos.chat': ChatArt,
  'com.gulfos.mail': MailArt,
  'com.gulfos.camera': CameraArt,
  'com.gulfos.gallery': PhotosArt,
  'com.gulfos.maps': MapsArt,
  'com.gulfos.files': FilesArt,
  'com.gulfos.browser': BrowserArt,
  'com.gulfos.settings': SettingsArt,
  'com.gulfos.store': StoreArt,
  'com.gulfos.clock': ClockArt,
  'com.gulfos.calculator': CalculatorArt,
  'com.gulfos.notes': NotesArt,
  'com.gulfos.weather': WeatherArt,
  'com.gulfos.calendar': CalendarArt,
  'com.gulfos.contacts': ContactsArt,
  'com.gulfos.bank': BankArt,
  'com.gulfos.identity': IdentityArt,
  'com.gulfos.recorder': RecorderArt,
  'com.gulfos.police': PoliceArt,
  'com.gulfos.justice': JusticeArt,
  'com.gulfos.ems': EmsArt,
  'com.gulfos.poetry': PoetryArt,
};

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
  'com.gulfos.find-my': ['#A7FFEB', '#00BFA5'],
  'com.gulfos.developer': ['#616161', '#212121'],
  'com.gulfos.analytics': ['#9FA8DA', '#283593'],
  'com.gulfos.diagnostics': ['#FFCC80', '#E65100'],
  'com.gulfos.enterprise': ['#B0BEC5', '#37474F'],
  'com.gulfos.performance': ['#FFF59D', '#F9A825'],
  'com.gulfos.updates': ['#80DEEA', '#00838F'],
};

export function hasIconArt(bundleId?: string): boolean {
  return !!bundleId && (bundleId in ART || bundleId in FALLBACK_GRADIENTS);
}

export function IOSIconArt({ bundleId, emoji, size }: { bundleId?: string; emoji: string; size: number }) {
  if (bundleId && ART[bundleId]) {
    const Art = ART[bundleId];
    return <Art size={size} />;
  }
  const gradient: [string, string] = (bundleId ? FALLBACK_GRADIENTS[bundleId] : undefined) ?? ['#3A3A3C', '#1C1C1E'];
  return <DefaultArt size={size} emoji={emoji} gradient={gradient} />;
}
