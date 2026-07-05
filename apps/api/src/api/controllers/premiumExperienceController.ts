import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as premiumExperienceService from '../../services/premiumExperienceService';
import * as widgetEngineService from '../../services/widgetEngineService';
import { LOCK_SCREEN_LAYOUTS, MULTITASKING_MODES, CLOCK_FONTS, CLOCK_COLORS } from '../../constants/premiumExperience';

function actorId(req: Request): string {
  return (req as Request & { user?: { userId: string } }).user!.userId;
}

function userId(req: Request): string {
  return actorId(req);
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function initializeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await premiumExperienceService.initializePremiumExperience(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await premiumExperienceService.getPremiumExperience(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await premiumExperienceService.updatePremiumExperience(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function trackAppUsageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { bundleId } = req.body;
    const data = await premiumExperienceService.trackAppUsage(userId(req), bundleId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addQuickNoteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ note: z.string().min(1).max(500) });
    const { note } = schema.parse(req.body);
    const data = await premiumExperienceService.addQuickNote(userId(req), note, actorId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getAppLibraryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await premiumExperienceService.getAppLibrary(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getNotificationHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await premiumExperienceService.getNotificationHistory(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function pinNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ pinned: z.boolean() });
    const { pinned } = schema.parse(req.body);
    const data = await premiumExperienceService.pinNotification(
      userId(req),
      paramId(req.params.notificationId),
      pinned,
      actorId(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWidgetRegistryHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await widgetEngineService.getWidgetRegistry();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWidgetDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const type = paramId(req.params.type);
    const data = await widgetEngineService.getWidgetData(userId(req), type, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getBatchWidgetDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      widgets: z.array(z.object({ type: z.string(), config: z.record(z.unknown()).optional() })),
    });
    const { widgets } = schema.parse(req.body);
    const data = await widgetEngineService.getBatchWidgetData(userId(req), widgets);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
