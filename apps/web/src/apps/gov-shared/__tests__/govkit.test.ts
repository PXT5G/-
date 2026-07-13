import { describe, it, expect } from 'vitest';
import { fuzzyMatch, rankCommands, statusTone, type PaletteCommand } from '../govLogic';

const noop = () => {};

describe('GovKit fuzzyMatch', () => {
  it('matches subsequences case-insensitively', () => {
    expect(fuzzyMatch('evd', 'Evidence Locker')).toBe(true);
    expect(fuzzyMatch('CAL', 'Court Calendar')).toBe(true);
    expect(fuzzyMatch('prison', 'Prison')).toBe(true);
  });

  it('rejects non-matching queries', () => {
    expect(fuzzyMatch('xyz', 'Evidence')).toBe(false);
    expect(fuzzyMatch('warrantz', 'Warrants')).toBe(false);
  });

  it('empty query matches everything', () => {
    expect(fuzzyMatch('', 'Anything')).toBe(true);
  });

  it('ignores whitespace in the query', () => {
    expect(fuzzyMatch('go duty', 'Go On Duty')).toBe(true);
  });
});

describe('GovKit rankCommands', () => {
  const commands: PaletteCommand[] = [
    { id: 'audit', label: 'Audit Log', run: noop },
    { id: 'analytics', label: 'Analytics', run: noop },
    { id: 'cases', label: 'Case Builder', run: noop },
  ];

  it('ranks recently used commands first', () => {
    const ranked = rankCommands(commands, '', ['analytics']);
    expect(ranked[0].id).toBe('analytics');
  });

  it('filters by fuzzy query and sorts alphabetically without recents', () => {
    const ranked = rankCommands(commands, 'a', []);
    expect(ranked.map((c) => c.id)).toEqual(['analytics', 'audit', 'cases']);
  });

  it('uses keywords for matching', () => {
    const withKeywords: PaletteCommand[] = [
      { id: 'panic', label: '🚨 Trigger Panic', keywords: 'emergency help', run: noop },
    ];
    expect(rankCommands(withKeywords, 'emergency', []).length).toBe(1);
  });
});

describe('GovKit statusTone', () => {
  it('maps operational statuses to tones', () => {
    expect(statusTone('active')).toBe('green');
    expect(statusTone('pending')).toBe('yellow');
    expect(statusTone('resolved')).toBe('gray');
    expect(statusTone('panic')).toBe('red');
    expect(statusTone('something_else')).toBe('gold');
  });
});
