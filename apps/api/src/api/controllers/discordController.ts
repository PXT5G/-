import { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import * as discordPrefs from '../../services/discord/discordPreferenceService';
import {
  listPendingDiscordNotifications,
  acknowledgeDiscordNotification,
} from '../../services/discord/discordNotificationProvider';
import type { DiscordNotificationCategory } from '../../constants/discordNotifications';
import * as discordSession from '../../services/discord/discordVerifiedSessionService';

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

export async function postSessionJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      gulfosUserId: string;
      discordUserId: string;
      externalUserId: string;
      externalCharacterId: string;
      gameServerId?: string;
      phoneId?: string;
      inventorySessionId?: string;
      characterSessionId?: string;
      dmChannelId?: string;
      attestation?: {
        hasPhoneItem: boolean;
        phoneInventoryItemId?: string;
        phoneId?: string;
        deviceId?: string;
      };
    };
    const required = ['gulfosUserId', 'discordUserId', 'externalUserId', 'externalCharacterId'] as const;
    for (const key of required) {
      if (!body[key]) {
        res.status(400).json({ success: false, error: `${key} is required` });
        return;
      }
    }
    const result = await discordSession.handlePlayerJoin(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postSessionLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const { gulfosUserId, reason } = req.body as { gulfosUserId: string; reason?: string };
    if (!gulfosUserId) {
      res.status(400).json({ success: false, error: 'gulfosUserId is required' });
      return;
    }
    const result = await discordSession.handlePlayerDisconnect({ gulfosUserId, reason });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postSessionHeartbeat(req: Request, res: Response, next: NextFunction) {
  try {
    const { gulfosUserId, verifiedSessionId } = req.body as {
      gulfosUserId: string;
      verifiedSessionId?: string;
    };
    if (!gulfosUserId) {
      res.status(400).json({ success: false, error: 'gulfosUserId is required' });
      return;
    }
    const session = await discordSession.recordSessionHeartbeat(gulfosUserId, verifiedSessionId);
    if (!session) {
      res.status(404).json({ success: false, error: 'VERIFIED_SESSION_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function postCharacterSwitch(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      gulfosUserId: string;
      discordUserId: string;
      externalUserId: string;
      previousCharacterId?: string;
      newCharacterId: string;
      phoneId?: string;
      inventorySessionId?: string;
      gameServerId?: string;
      attestation?: {
        hasPhoneItem: boolean;
        phoneInventoryItemId?: string;
        phoneId?: string;
        deviceId?: string;
      };
    };
    if (!body.gulfosUserId || !body.discordUserId || !body.externalUserId || !body.newCharacterId) {
      res.status(400).json({ success: false, error: 'gulfosUserId, discordUserId, externalUserId, and newCharacterId are required' });
      return;
    }
    const result = await discordSession.handleCharacterSwitchForDiscord(body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postPhoneRemoved(req: Request, res: Response, next: NextFunction) {
  try {
    const { gulfosUserId, externalCharacterId, inventorySessionId } = req.body as {
      gulfosUserId: string;
      externalCharacterId: string;
      inventorySessionId?: string;
    };
    if (!gulfosUserId || !externalCharacterId) {
      res.status(400).json({ success: false, error: 'gulfosUserId and externalCharacterId are required' });
      return;
    }
    const result = await discordSession.handlePhoneRemovedFromInventory({
      gulfosUserId,
      externalCharacterId,
      inventorySessionId,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
