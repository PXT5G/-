import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCK_SCREEN_LAYOUTS,
  CLOCK_FONTS,
  CLOCK_COLORS,
  WALLPAPER_COLLECTIONS,
  MULTITASKING_MODES,
  CONTROL_CENTER_PAGES,
  WIDGET_TYPES,
  WIDGET_SIZES,
  NOTIFICATION_GROUP_STRATEGIES,
  DYNAMIC_ISLAND_ACTIVITY_TYPES,
} from '../../constants/premiumExperience';

describe('premium experience constants', () => {
  it('defines lock screen layouts', () => {
    assert.ok(LOCK_SCREEN_LAYOUTS.includes('classic'));
    assert.ok(LOCK_SCREEN_LAYOUTS.includes('focus'));
    assert.equal(LOCK_SCREEN_LAYOUTS.length, 5);
  });

  it('defines clock customization options', () => {
    assert.ok(CLOCK_FONTS.includes('mono'));
    assert.ok(CLOCK_COLORS.includes('gradient'));
  });

  it('defines wallpaper collections', () => {
    assert.ok(WALLPAPER_COLLECTIONS.includes('gulf-gold'));
    assert.ok(WALLPAPER_COLLECTIONS.includes('aurora'));
  });

  it('defines multitasking modes', () => {
    assert.deepEqual([...MULTITASKING_MODES], ['cards', 'grid', 'horizontal']);
  });

  it('defines control center pages', () => {
    assert.ok(CONTROL_CENTER_PAGES.includes('connectivity'));
    assert.ok(CONTROL_CENTER_PAGES.includes('shortcuts'));
  });

  it('defines widget types for all major apps', () => {
    assert.ok(WIDGET_TYPES.includes('weather'));
    assert.ok(WIDGET_TYPES.includes('bank'));
    assert.ok(WIDGET_TYPES.includes('police'));
    assert.ok(WIDGET_TYPES.includes('browser'));
    assert.equal(WIDGET_SIZES.length, 3);
  });

  it('defines notification grouping strategies', () => {
    assert.ok(NOTIFICATION_GROUP_STRATEGIES.includes('priority'));
    assert.ok(NOTIFICATION_GROUP_STRATEGIES.includes('app'));
  });

  it('defines dynamic island activity types', () => {
    assert.ok(DYNAMIC_ISLAND_ACTIVITY_TYPES.includes('charging'));
    assert.ok(DYNAMIC_ISLAND_ACTIVITY_TYPES.includes('bank_transfer'));
    assert.ok(DYNAMIC_ISLAND_ACTIVITY_TYPES.includes('ems'));
  });
});

describe('premium experience routes', () => {
  it('mounts premium routes under device routes', async () => {
    const premiumRoutes = await import('../../api/routes/premiumExperience');
    assert.ok(premiumRoutes.default);
  });

  it('exports widget engine service', async () => {
    const widgetEngine = await import('../../services/widgetEngineService');
    assert.equal(typeof widgetEngine.getWidgetRegistry, 'function');
    assert.equal(typeof widgetEngine.getWidgetData, 'function');
    assert.equal(typeof widgetEngine.seedWidgetRegistry, 'function');
  });

  it('exports premium experience service', async () => {
    const service = await import('../../services/premiumExperienceService');
    assert.equal(typeof service.initializePremiumExperience, 'function');
    assert.equal(typeof service.getPremiumExperience, 'function');
    assert.equal(typeof service.getAppLibrary, 'function');
  });
});
