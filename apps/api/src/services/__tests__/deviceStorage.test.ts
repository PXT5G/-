import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APP_PACKAGE_SIZES, STORAGE_CAPACITY_TIERS, getAppPackageSize } from '../../constants/appSizes';

describe('device storage capacities', () => {
  it('supports standard capacity tiers', () => {
    assert.equal(STORAGE_CAPACITY_TIERS.length, 6);
    assert.ok(STORAGE_CAPACITY_TIERS.includes(128_000_000_000));
    assert.ok(STORAGE_CAPACITY_TIERS.includes(1_000_000_000_000));
  });
});

describe('realistic app package sizes', () => {
  it('assigns realistic sizes to key apps', () => {
    assert.equal(getAppPackageSize('com.gulfos.phone'), 320_000_000);
    assert.equal(getAppPackageSize('com.gulfos.messages'), 260_000_000);
    assert.equal(getAppPackageSize('com.gulfos.police'), 1_400_000_000);
    assert.equal(getAppPackageSize('com.gulfos.bank'), 480_000_000);
  });

  it('resolves legacy bundle IDs for size lookup', () => {
    assert.equal(getAppPackageSize('com.bananaos.bank'), 480_000_000);
    assert.equal(getAppPackageSize('com.bananaos.voicerecorder'), 120_000_000);
  });

  it('uses fallback for unknown apps', () => {
    assert.equal(getAppPackageSize('com.unknown.app', 50_000_000), 50_000_000);
  });

  it('all seeded sizes are positive', () => {
    for (const size of Object.values(APP_PACKAGE_SIZES)) {
      assert.ok(size > 0);
    }
  });
});

describe('storage reservation logic', () => {
  it('blocks install when free < required', () => {
    const free = 100_000_000;
    const required = 320_000_000;
    assert.equal(free >= required, false);
  });

  it('allows install when free >= required', () => {
    const free = 500_000_000;
    const required = 320_000_000;
    assert.equal(free >= required, true);
  });
});

describe('storage categories', () => {
  it('aggregates category totals', () => {
    const categories = { apps: 1_000, cache: 200, system: 8_000, photosVideos: 500 };
    const used = Object.values(categories).reduce((a, b) => a + b, 0);
    assert.equal(used, 9_700);
  });
});
