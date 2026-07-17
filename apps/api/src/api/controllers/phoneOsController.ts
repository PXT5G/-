import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as phoneOsService from '../../services/phoneOsService';
import * as phoneOsConfigService from '../../services/phoneOsConfigService';
import * as liveActivityService from '../../services/liveActivityService';
import * as globalSearchService from '../../services/globalSearchService';
import { SEARCH_CATEGORIES, PERFORMANCE_MODES, POWER_ACTIONS } from '../../constants/phoneOs';
import { CHARGING_TYPES } from '../../constants/deviceEcosystem';
import { LIVE_ACTIVITY_TYPES } from '../../constants/phoneOs';

function actorId(req: Request): string {
  return (req as Request & { user?: { userId: string } }).user!.userId;
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function userId(req: Request): string {
  return actorId(req);
}

export async function initializeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.initializePhoneOs(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDeviceInfoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.getFullDeviceInfo(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function powerActionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ action: z.enum(POWER_ACTIONS) });
    const { action } = schema.parse(req.body);
    const data = await phoneOsService.executePowerAction(userId(req), action, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function startChargingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      chargingType: z.enum(CHARGING_TYPES.filter((t) => t !== 'none') as [string, ...string[]]).default('wired'),
    });
    const { chargingType } = schema.parse(req.body);
    const data = await phoneOsService.startCharging(
      userId(req),
      chargingType as 'wired' | 'fast' | 'wireless',
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function stopChargingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.stopCharging(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getBatteryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.syncBatteryState(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPerformanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.refreshPerformanceState(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function setPerformanceModeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ mode: z.enum(PERFORMANCE_MODES) });
    const { mode } = schema.parse(req.body);
    const data = await phoneOsService.setPerformanceMode(userId(req), mode, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function freezeAppHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bundleId = paramId(req.params.bundleId);
    const data = await phoneOsService.freezeBackgroundApp(userId(req), bundleId, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function pinAppHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bundleId = paramId(req.params.bundleId);
    const schema = z.object({ pinned: z.boolean() });
    const { pinned } = schema.parse(req.body);
    const data = await phoneOsService.pinBackgroundApp(userId(req), bundleId, pinned, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function diagnosticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsService.getDeviceDiagnostics(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getConfigsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.getPhoneOsConfigs(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateControlCenterHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateControlCenterConfig(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateLockScreenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateLockScreenConfig(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStatusBarHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateStatusBarConfig(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateWallpaperHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateWallpaperConfig(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateWidgetLayoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateWidgetLayout(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateNotificationPrefsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateNotificationPreferences(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateAccessibilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneOsConfigService.updateAccessibilityConfig(
      userId(req),
      req.body,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createLiveActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      type: z.enum(LIVE_ACTIVITY_TYPES),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      icon: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
      appId: z.string().min(1),
      payload: z.record(z.unknown()).optional(),
      dynamicIsland: z.boolean().optional(),
      lockScreen: z.boolean().optional(),
    });
    const input = schema.parse(req.body);
    const data = await liveActivityService.createLiveActivity(userId(req), input, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateLiveActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      icon: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
      state: z.enum(['active', 'paused', 'ended', 'dismissed']).optional(),
      payload: z.record(z.unknown()).optional(),
    });
    const updates = schema.parse(req.body);
    const data = await liveActivityService.updateLiveActivity(
      userId(req),
      paramId(req.params.activityId),
      updates,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getLiveActivitiesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await liveActivityService.getActiveLiveActivities(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getLiveActivityHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await liveActivityService.getLiveActivityHistory(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function endLiveActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await liveActivityService.endLiveActivity(
      userId(req),
      paramId(req.params.activityId),
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function globalSearchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      q: z.string().min(1),
      categories: z.array(z.enum(SEARCH_CATEGORIES)).optional(),
    });
    const { q, categories } = schema.parse(req.query);
    const data = await globalSearchService.globalSearch(userId(req), q, categories);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
