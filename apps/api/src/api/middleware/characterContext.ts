import { Request, Response, NextFunction } from 'express';
import { CHARACTER_HEADERS, type CharacterPlatform } from '../../constants/characterPhone';
import type { CharacterContextInput } from '../../services/characterPhoneService';
import type { ServiceAuthRequest } from './serviceAuth';

export interface CharacterContextRequest extends ServiceAuthRequest {
  characterContext?: CharacterContextInput;
}

function headerValue(req: Request, name: string): string | undefined {
  const raw = req.headers[name];
  if (typeof raw === 'string') return raw.trim() || undefined;
  if (Array.isArray(raw)) return raw[0]?.trim() || undefined;
  return undefined;
}

export function parseCharacterContext(req: Request): CharacterContextInput | null {
  const platform = (headerValue(req, CHARACTER_HEADERS.PLATFORM) ??
    (req.body as { platform?: string })?.platform ??
    'discord') as CharacterPlatform;

  const externalUserId =
    headerValue(req, CHARACTER_HEADERS.EXTERNAL_USER_ID) ??
    (req.body as { externalUserId?: string })?.externalUserId;

  const externalCharacterId =
    headerValue(req, CHARACTER_HEADERS.CHARACTER_ID) ??
    (req.body as { characterId?: string; externalCharacterId?: string })?.characterId ??
    (req.body as { externalCharacterId?: string })?.externalCharacterId;

  const characterSessionId =
    headerValue(req, CHARACTER_HEADERS.CHARACTER_SESSION_ID) ??
    (req.body as { characterSessionId?: string })?.characterSessionId;

  const inventorySessionId =
    headerValue(req, CHARACTER_HEADERS.INVENTORY_SESSION_ID) ??
    (req.body as { inventorySessionId?: string })?.inventorySessionId;

  const phoneId =
    headerValue(req, CHARACTER_HEADERS.PHONE_ID) ?? (req.body as { phoneId?: string })?.phoneId;

  const deviceId =
    headerValue(req, CHARACTER_HEADERS.DEVICE_ID) ??
    (req.body as { deviceId?: string })?.deviceId;

  if (!externalUserId || !externalCharacterId) return null;

  return {
    platform,
    externalUserId,
    externalCharacterId,
    characterSessionId,
    inventorySessionId,
    phoneId,
    deviceId,
  };
}

export function attachCharacterContext(
  req: CharacterContextRequest,
  _res: Response,
  next: NextFunction
): void {
  const ctx = parseCharacterContext(req);
  if (ctx) req.characterContext = ctx;
  next();
}

export async function requireVerifiedCharacterPhone(
  req: CharacterContextRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ctx = req.characterContext ?? parseCharacterContext(req);
  if (!ctx) {
    res.status(400).json({ success: false, error: 'CHARACTER_CONTEXT_INCOMPLETE' });
    return;
  }

  try {
    const { verifyPhoneAccess } = await import('../../services/characterPhoneService');
    const result = await verifyPhoneAccess(ctx);
    if (!result.verified) {
      res.status(403).json({ success: false, error: result.code, message: result.message });
      return;
    }
    (req as CharacterContextRequest & { phoneVerification?: typeof result }).phoneVerification = result;
    next();
  } catch (err) {
    next(err);
  }
}
