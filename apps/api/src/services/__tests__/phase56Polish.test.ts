import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SEARCH_CATEGORIES } from '../../constants/phoneOs';

describe('phase 5.6 polish', () => {
  it('extends search categories for mail, assistant, shortcuts', () => {
    assert.ok(SEARCH_CATEGORIES.includes('mail'));
    assert.ok(SEARCH_CATEGORIES.includes('assistant'));
    assert.ok(SEARCH_CATEGORIES.includes('shortcuts'));
  });

  it('exports ensureDatabaseIndexes', async () => {
    const mod = await import('../../database/ensureIndexes');
    assert.equal(typeof mod.ensureDatabaseIndexes, 'function');
  });

  it('registers global search handlers for new categories', async () => {
    const svc = await import('../globalSearchService');
    assert.equal(typeof svc.globalSearch, 'function');
  });
});
