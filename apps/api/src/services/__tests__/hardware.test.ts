import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_RAM_PROFILES,
  getAppRamProfile,
  getLowStorageLevel,
  LOW_STORAGE_THRESHOLDS,
  estimatePhotoSize,
  estimateVideoSize,
  DEVICE_GENERATIONS,
} from '../../constants/hardwareSpecs';

describe('hardware RAM profiles', () => {
  it('assigns realistic RAM to key apps', () => {
    assert.equal(getAppRamProfile('com.bananaos.phone').active, 120_000_000);
    assert.equal(getAppRamProfile('com.bananaos.messages').active, 90_000_000);
    assert.equal(getAppRamProfile('com.bananaos.bank').active, 180_000_000);
    assert.equal(getAppRamProfile('com.bananaos.police').active, 350_000_000);
    assert.equal(getAppRamProfile('com.bananaos.camera').active, 450_000_000);
    assert.equal(getAppRamProfile('com.bananaos.gallery').active, 220_000_000);
  });

  it('uses fallback for unknown apps', () => {
    const profile = getAppRamProfile('com.unknown.app');
    assert.ok(profile.active > 0);
    assert.ok(profile.background > 0);
  });

  it('all profiles have base/active/background/cached', () => {
    for (const profile of Object.values(APP_RAM_PROFILES)) {
      assert.ok(profile.base > 0);
      assert.ok(profile.active >= profile.base);
      assert.ok(profile.background <= profile.active);
      assert.ok(profile.cached <= profile.background);
    }
  });
});

describe('device generations', () => {
  it('defines hardware specs for each generation', () => {
    assert.ok(DEVICE_GENERATIONS.length >= 3);
    for (const gen of DEVICE_GENERATIONS) {
      assert.ok(gen.ram >= 8_000_000_000);
      assert.ok(gen.battery > 4000);
      assert.ok(gen.display.includes('×'));
    }
  });
});

describe('low storage thresholds', () => {
  it('returns warning at 20% free', () => {
    assert.equal(getLowStorageLevel(0.19), 'warning');
    assert.equal(getLowStorageLevel(0.25), 'normal');
  });

  it('returns low mode at 10% free', () => {
    assert.equal(getLowStorageLevel(0.09), 'low');
    assert.equal(getLowStorageLevel(0.15), 'warning');
  });

  it('returns critical at 5% free', () => {
    assert.equal(getLowStorageLevel(0.04), 'critical');
    assert.equal(getLowStorageLevel(0.07), 'low');
  });

  it('returns emergency at 1% free', () => {
    assert.equal(getLowStorageLevel(0.005), 'emergency');
    assert.equal(getLowStorageLevel(0.02), 'critical');
  });

  it('has ordered thresholds', () => {
    assert.ok(LOW_STORAGE_THRESHOLDS.warning > LOW_STORAGE_THRESHOLDS.lowMode);
    assert.ok(LOW_STORAGE_THRESHOLDS.lowMode > LOW_STORAGE_THRESHOLDS.blockInstall);
    assert.ok(LOW_STORAGE_THRESHOLDS.blockInstall > LOW_STORAGE_THRESHOLDS.emergency);
  });
});

describe('media storage estimation', () => {
  it('estimates photo size by megapixels', () => {
    const size12mp = estimatePhotoSize(12);
    assert.ok(size12mp > 3_000_000);
    assert.ok(size12mp < 6_000_000);
  });

  it('estimates video size by resolution fps duration codec', () => {
    const hevc = estimateVideoSize(1920, 1080, 30, 60, 'hevc');
    const h264 = estimateVideoSize(1920, 1080, 30, 60, 'h264');
    assert.ok(hevc > 0);
    assert.ok(h264 > hevc);
  });
});

describe('memory pressure logic', () => {
  it('blocks heavy apps when free RAM insufficient', () => {
    const total = 8_000_000_000;
    const used = 7_600_000_000;
    const pressure = used / total;
    const cameraActive = getAppRamProfile('com.bananaos.camera').active;
    const free = total - used;
    assert.ok(pressure >= 0.85);
    assert.equal(free < cameraActive, true);
  });
});
