/**
 * Pure (React-free) logic for the government app kit: command palette
 * matching/ranking, status→tone mapping and localStorage helpers.
 * Kept in a .ts module so it is unit-testable without JSX tooling.
 */

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
}

export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase();
  if (!q) return true;
  let ti = 0;
  for (const ch of q) {
    ti = t.indexOf(ch, ti);
    if (ti === -1) return false;
    ti += 1;
  }
  return true;
}

export function rankCommands(commands: PaletteCommand[], query: string, recents: string[]): PaletteCommand[] {
  const matched = commands.filter((c) => fuzzyMatch(query, `${c.label} ${c.keywords ?? ''}`));
  return matched.sort((a, b) => {
    const ra = recents.indexOf(a.id);
    const rb = recents.indexOf(b.id);
    const wa = ra === -1 ? 99 : ra;
    const wb = rb === -1 ? 99 : rb;
    if (wa !== wb) return wa - wb;
    return a.label.localeCompare(b.label);
  });
}

export type BadgeTone = 'gold' | 'red' | 'green' | 'blue' | 'purple' | 'yellow' | 'gray';

/** Status → tone mapping shared across gov domains */
export function statusTone(status?: string): BadgeTone {
  switch (status) {
    case 'active': case 'open': case 'filed': case 'issued': case 'available': case 'on_duty': case 'approved': case 'guilty':
      return 'green';
    case 'pending': case 'draft': case 'investigating': case 'scheduled': case 'contested': case 'break': case 'under_review':
      return 'yellow';
    case 'resolved': case 'closed': case 'served': case 'paid': case 'discharged': case 'off_duty': case 'dismissed':
      return 'gray';
    case 'panic': case 'critical': case 'high': case 'extreme': case 'denied': case 'en_route':
      return 'red';
    default:
      return 'gold';
  }
}

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full/blocked — non-critical
  }
}
