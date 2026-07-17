import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import type { CharacterContextRequest } from '../middleware/characterContext';
import * as characterPhoneService from '../../services/characterPhoneService';
import * as characterSessionService from '../../services/characterSessionService';
import type { CharacterPlatform } from '../../constants/characterPhone';

function platformFromBody(body: { platform?: string }): CharacterPlatform {
  const p = body.platform ?? 'discord';
  if (!['discord', 'web', 'simulator'].includes(p)) {
    throw new AppError(400, 'INVALID_PLATFORM');
  }
  return p as CharacterPlatform;
}

export async function postLinkAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { platform, externalUserId, gulfosUserId, metadata } = req.body as {
      platform?: string;
      externalUserId: string;
      gulfosUserId: string;
      metadata?: Record<string, unknown>;
    };
    if (!externalUserId || !gulfosUserId) {
      res.status(400).json({ success: false, error: 'externalUserId and gulfosUserId are required' });
      return;
    }
    const link = await characterPhoneService.linkExternalAccount({
      platform: platformFromBody({ platform }),
      externalUserId,
      gulfosUserId,
      metadata,
    });
    res.status(201).json({ success: true, data: link });
  } catch (err) {
    next(err);
  }
}

export async function postRegisterCharacter(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      externalCharacterId: string;
      externalUserId: string;
      gulfosUserId?: string;
      displayName?: string;
      metadata?: Record<string, unknown>;
    };
    if (!body.externalCharacterId || !body.externalUserId) {
      res.status(400).json({ success: false, error: 'externalCharacterId and externalUserId are required' });
      return;
    }
    const character = await characterPhoneService.upsertCharacter({
      platform: platformFromBody(body),
      externalCharacterId: body.externalCharacterId,
      externalUserId: body.externalUserId,
      gulfosUserId: body.gulfosUserId,
      displayName: body.displayName,
      metadata: body.metadata,
    });
    res.status(201).json({ success: true, data: character });
  } catch (err) {
    next(err);
  }
}

export async function postBindPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      externalCharacterId: string;
      externalUserId: string;
      gulfosUserId?: string;
      phoneId: string;
      deviceUuid: string;
      phoneNumber: string;
      inventoryItemId: string;
    };
    const required = ['externalCharacterId', 'externalUserId', 'phoneId', 'deviceUuid', 'phoneNumber', 'inventoryItemId'] as const;
    for (const key of required) {
      if (!body[key]) {
        res.status(400).json({ success: false, error: `${key} is required` });
        return;
      }
    }
    const phone = await characterPhoneService.bindCharacterPhone({
      platform: platformFromBody(body),
      externalCharacterId: body.externalCharacterId,
      externalUserId: body.externalUserId,
      gulfosUserId: body.gulfosUserId,
      phoneId: body.phoneId,
      deviceUuid: body.deviceUuid,
      phoneNumber: body.phoneNumber,
      inventoryItemId: body.inventoryItemId,
    });
    res.status(201).json({ success: true, data: phone });
  } catch (err) {
    next(err);
  }
}

export async function postOpenSession(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      externalUserId: string;
      externalCharacterId: string;
      gulfosUserId?: string;
      phoneId?: string;
      inventorySessionId?: string;
      characterSessionId?: string;
    };
    if (!body.externalUserId || !body.externalCharacterId) {
      res.status(400).json({ success: false, error: 'externalUserId and externalCharacterId are required' });
      return;
    }
    const session = await characterSessionService.openCharacterSession({
      platform: platformFromBody(body),
      externalUserId: body.externalUserId,
      externalCharacterId: body.externalCharacterId,
      gulfosUserId: body.gulfosUserId,
      phoneId: body.phoneId,
      inventorySessionId: body.inventorySessionId,
      characterSessionId: body.characterSessionId,
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function postCharacterChanged(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      externalUserId: string;
      previousCharacterId?: string;
      newCharacterId: string;
      gulfosUserId?: string;
      inventorySessionId?: string;
      phoneId?: string;
      deviceId?: string;
      attestation?: {
        hasPhoneItem: boolean;
        phoneInventoryItemId?: string;
        phoneId?: string;
        deviceId?: string;
      };
    };
    if (!body.externalUserId || !body.newCharacterId) {
      res.status(400).json({ success: false, error: 'externalUserId and newCharacterId are required' });
      return;
    }
    const result = await characterSessionService.handleCharacterChanged({
      platform: platformFromBody(body),
      externalUserId: body.externalUserId,
      previousCharacterId: body.previousCharacterId,
      newCharacterId: body.newCharacterId,
      gulfosUserId: body.gulfosUserId,
      inventorySessionId: body.inventorySessionId,
      phoneId: body.phoneId,
      deviceId: body.deviceId,
      attestation: body.attestation,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postVerifyPhone(req: CharacterContextRequest, res: Response, next: NextFunction) {
  try {
    const ctx = req.characterContext;
    if (!ctx) {
      res.status(400).json({ success: false, error: 'CHARACTER_CONTEXT_INCOMPLETE' });
      return;
    }
    const result = await characterPhoneService.verifyPhoneAccess(ctx);
    if (!result.verified) {
      res.status(403).json({ success: false, error: result.code, message: result.message });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postInventoryAttestation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      inventorySessionId: string;
      externalUserId: string;
      externalCharacterId: string;
      hasPhoneItem: boolean;
      phoneInventoryItemId?: string;
      phoneId?: string;
      deviceId?: string;
    };
    if (!body.inventorySessionId || !body.externalUserId || !body.externalCharacterId) {
      res.status(400).json({ success: false, error: 'inventorySessionId, externalUserId, and externalCharacterId are required' });
      return;
    }
    const attestation = await characterPhoneService.storeInventoryAttestation({
      platform: platformFromBody(body),
      inventorySessionId: body.inventorySessionId,
      externalUserId: body.externalUserId,
      externalCharacterId: body.externalCharacterId,
      hasPhoneItem: body.hasPhoneItem ?? false,
      phoneInventoryItemId: body.phoneInventoryItemId,
      phoneId: body.phoneId,
      deviceId: body.deviceId,
    });
    res.status(201).json({ success: true, data: attestation });
  } catch (err) {
    next(err);
  }
}

export async function getActiveSession(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = platformFromBody({ platform: req.query.platform as string | undefined });
    const externalUserId = req.query.externalUserId as string | undefined;
    if (!externalUserId) {
      res.status(400).json({ success: false, error: 'externalUserId query param is required' });
      return;
    }
    const session = await characterSessionService.getActiveSession(platform, externalUserId);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function getCharacterPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = platformFromBody({ platform: req.query.platform as string | undefined });
    const externalCharacterId = req.query.characterId as string | undefined;
    if (!externalCharacterId) {
      res.status(400).json({ success: false, error: 'characterId query param is required' });
      return;
    }
    const phone = await characterPhoneService.getCharacterPhone(platform, externalCharacterId);
    if (!phone) {
      res.status(404).json({ success: false, error: 'PHONE_NOT_REGISTERED' });
      return;
    }
    res.json({ success: true, data: phone });
  } catch (err) {
    next(err);
  }
}

export async function postRevokePhone(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      platform?: string;
      externalCharacterId: string;
      reason: 'seized' | 'transferred' | 'deleted' | 'suspended' | 'unbound';
      inventorySessionId?: string;
    };
    if (!body.externalCharacterId || !body.reason) {
      res.status(400).json({ success: false, error: 'externalCharacterId and reason are required' });
      return;
    }
    const { revokePhonePresence } = await import('../../services/phonePresenceService');
    await revokePhonePresence({
      platform: platformFromBody(body),
      externalCharacterId: body.externalCharacterId,
      reason: body.reason,
      inventorySessionId: body.inventorySessionId,
    });
    res.json({ success: true, data: { revoked: true, reason: body.reason } });
  } catch (err) {
    next(err);
  }
}
