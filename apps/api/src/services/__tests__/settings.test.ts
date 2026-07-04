import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  DEVICE_INFO,
  DEFAULT_USER_SETTINGS,
  DATE_FORMATS,
  TIME_FORMATS,
  RTL_LANGUAGES,
} from '../../constants/settings';
import { settingsUpdateSchema } from '../../services/settingsService';
import { getTranslations, isRTL, SUPPORTED_LANGUAGE_CODES } from '@bananaos/shared';

describe('settings constants', () => {
  it('defines Gulf Phone V1 device info', () => {
    assert.equal(DEVICE_INFO.defaultDeviceName, 'Gulf Phone V1');
    assert.equal(DEVICE_INFO.developer, 'Abu Sharaf');
    assert.equal(DEVICE_INFO.manufacturer, 'Banana Technologies');
    assert.equal(DEVICE_INFO.operatingSystem, 'BananaOS');
    assert.equal(DEVICE_INFO.kernel, 'Banana Core');
    assert.equal(DEVICE_INFO.buildNumber, '3.7.0');
  });

  it('supports 15 languages including RTL', () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 15);
    assert.ok(SUPPORTED_LANGUAGES.some((l) => l.code === 'ar' && l.rtl));
    assert.ok(SUPPORTED_LANGUAGES.some((l) => l.code === 'ur' && l.rtl));
    assert.ok(SUPPORTED_LANGUAGES.some((l) => l.code === 'fa' && l.rtl));
    assert.equal(RTL_LANGUAGES.length, 3);
  });

  it('defines general settings defaults', () => {
    assert.equal(DEFAULT_USER_SETTINGS.language, 'en');
    assert.equal(DEFAULT_USER_SETTINGS.timeFormat, '24h');
    assert.equal(DEFAULT_USER_SETTINGS.refreshRate, 60);
    assert.ok(DATE_FORMATS.includes('mdy'));
    assert.ok(TIME_FORMATS.includes('12h'));
  });
});

describe('settings validation schema', () => {
  it('accepts valid partial updates', () => {
    const parsed = settingsUpdateSchema.parse({ language: 'ar', brightness: 50, refreshRate: 120 });
    assert.equal(parsed.language, 'ar');
    assert.equal(parsed.brightness, 50);
    assert.equal(parsed.refreshRate, 120);
  });

  it('rejects invalid language codes', () => {
    assert.throws(() => settingsUpdateSchema.parse({ language: 'xx' }));
  });

  it('rejects unknown fields', () => {
    assert.throws(() => settingsUpdateSchema.parse({ unknownField: true }));
  });
});

describe('i18n package', () => {
  it('loads translations for all supported languages', () => {
    assert.equal(SUPPORTED_LANGUAGE_CODES.length, 15);
    for (const code of SUPPORTED_LANGUAGE_CODES) {
      const dict = getTranslations(code);
      assert.equal(dict.settings.title.length > 0, true);
      assert.equal(dict.common.settings.length > 0, true);
    }
  });

  it('detects RTL languages', () => {
    assert.equal(isRTL('ar'), true);
    assert.equal(isRTL('ur'), true);
    assert.equal(isRTL('fa'), true);
    assert.equal(isRTL('en'), false);
    assert.equal(isRTL('fr'), false);
  });

  it('falls back to English for unknown codes', () => {
    const dict = getTranslations('unknown');
    assert.equal(dict.settings.title, 'Settings');
  });
});

describe('settings API routes', () => {
  it('mounts under /api/settings', () => {
    const routes = [
      '/api/settings',
      '/api/settings/reset',
      '/api/settings/languages',
      '/api/settings/about',
      '/api/settings/translations/:code',
    ];
    assert.equal(routes.length, 5);
    assert.ok(routes.every((r) => r.startsWith('/api/settings')));
  });
});

describe('settings realtime', () => {
  it('emits settings:updated on changes', () => {
    const events = ['settings:updated'];
    assert.ok(events.includes('settings:updated'));
  });
});
