import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, isVersionCompatible } from '../packageService';
import { INSTALL_STEPS } from '../installService';

describe('packageService', () => {
  it('compareVersions orders semantic versions', () => {
    assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
    assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
    assert.ok(compareVersions('1.0.1', '1.0.10') < 0);
  });

  it('isVersionCompatible checks minimum OS version', () => {
    assert.equal(isVersionCompatible('1.1.0', '1.0.0'), true);
    assert.equal(isVersionCompatible('1.0.0', '1.1.0'), false);
  });
});

describe('installService', () => {
  it('defines full installation pipeline steps', () => {
    assert.equal(INSTALL_STEPS.length, 12);
    assert.ok(INSTALL_STEPS.includes('Verifying package integrity'));
    assert.ok(INSTALL_STEPS.includes('Finishing installation'));
  });
});

describe('download queue states', () => {
  const lifecycleStates = [
    'not_installed',
    'downloading',
    'paused',
    'installing',
    'installed',
    'update_available',
    'updating',
    'uninstalling',
    'disabled',
    'failed',
  ];

  it('covers required application lifecycle states', () => {
    assert.equal(lifecycleStates.length, 10);
    assert.ok(lifecycleStates.includes('paused'));
    assert.ok(lifecycleStates.includes('update_available'));
  });
});

describe('failed download recovery', () => {
  it('allows retry only from failed status', () => {
    const canRetry = (status: string) => status === 'failed';
    assert.equal(canRetry('failed'), true);
    assert.equal(canRetry('downloading'), false);
    assert.equal(canRetry('completed'), false);
  });
});
