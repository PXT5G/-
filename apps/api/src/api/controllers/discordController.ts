import { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import * as discordPrefs from '../../services/discord/discordPreferenceService';
import {
  listPendingDiscordNotifications,
  acknowledgeDiscordNotification,
} from '../../services/discord/discordNotificationProvider';
import type { DiscordNotificationCategory } from '../../constants/discordNotifications';

export async function postLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { gulfosUserId, discordUserId, dmChannelId, displayName } = req.body as {
      gulfosUserId: string;
      discordUserId: string;
      dmChannelId?: string;
      displayName?: string;
    };
    if (!gulfosUserId || !discordUserId) {
      res.status(400).json({ success: false, error: 'gulfosUserId and discordUserId are required' });
      return;
    }
    const link = await discordPrefs.linkDiscordAccount({
      gulfosUserId,
      discordUserId,
      dmChannelId,
      displayName,
    });
    res.status(201).json({ success: true, data: link });
  } catch (err) {
    next(err);
  }
}

export async function postUnlink(req: Request, res: Response, next: NextFunction) {
  try {
    const { gulfosUserId } = req.body as { gulfosUserId: string };
    if (!gulfosUserId) {
      res.status(400).json({ success: false, error: 'gulfosUserId is required' });
      return;
    }
    const link = await discordPrefs.unlinkDiscordAccount(gulfosUserId);
    res.json({ success: true, data: link });
  } catch (err) {
    next(err);
  }
}

export async function getPending(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const items = await listPendingDiscordNotifications(limit);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function postAck(req: Request, res: Response, next: NextFunction) {
  try {
    const outboxId = Array.isArray(req.params.outboxId) ? req.params.outboxId[0] : req.params.outboxId;
    const { success, failureReason } = req.body as { success?: boolean; failureReason?: string };
    const result = await acknowledgeDiscordNotification(outboxId, success !== false, failureReason);
    if (!result) {
      res.status(404).json({ success: false, error: 'OUTBOX_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const characterId = req.query.characterId as string | undefined;
    if (!req.user?.userId || !characterId) {
      res.status(400).json({ success: false, error: 'characterId is required' });
      return;
    }
    const prefs = await discordPrefs.getPreferences(req.user.userId, characterId);
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
}

export async function patchPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const characterId = req.query.characterId as string | undefined;
    if (!req.user?.userId || !characterId) {
      res.status(400).json({ success: false, error: 'characterId is required' });
      return;
    }
    const body = req.body as {
      discordEnabled?: boolean;
      categories?: Partial<Record<DiscordNotificationCategory, boolean>>;
      quietHours?: {
        enabled?: boolean;
        startTime?: string;
        endTime?: string;
        criticalOnly?: boolean;
        muteAll?: boolean;
        timezone?: string;
      };
    };
    const prefs = await discordPrefs.updatePreferences(req.user.userId, characterId, body);
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
}
