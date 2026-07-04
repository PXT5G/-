import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveBundleId,
  bundleIdVariants,
  isSameBundleId,
  LEGACY_BUNDLE_ID_MAP,
} from '../bundleIds';

describe('bundleIds migration', () => {
  it('resolves legacy bundle IDs to canonical GULFOS IDs', () => {
    assert.equal(resolveBundleId('com.gulfos.store'), 'com.gulfos.store');
    assert.equal(resolveBundleId('com.gulfos.police'), 'com.gulfos.police');
    assert.equal(resolveBundleId('com.bananaos.voicerecorder'), 'com.gulfos.recorder');
  });

  it('passes through canonical IDs unchanged', () => {
    assert.equal(resolveBundleId('com.gulfos.bank'), 'com.gulfos.bank');
  });

  it('returns legacy and canonical variants', () => {
    const variants = bundleIdVariants('com.gulfos.store');
    assert.ok(variants.includes('com.gulfos.store'));
    assert.ok(variants.includes('com.gulfos.store'));
  });

  it('treats legacy and canonical as same app', () => {
    assert.ok(isSameBundleId('com.gulfos.bank', 'com.gulfos.bank'));
  });

  it('maps every known legacy ID', () => {
    assert.ok(Object.keys(LEGACY_BUNDLE_ID_MAP).length >= 20);
    for (const [legacy, canonical] of Object.entries(LEGACY_BUNDLE_ID_MAP)) {
      assert.equal(resolveBundleId(legacy), canonical);
      assert.ok(canonical.startsWith('com.gulfos.'));
    }
  });
});
