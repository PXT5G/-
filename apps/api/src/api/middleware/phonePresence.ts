import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { parseCharacterContext } from './characterContext';
import {
  assertPhoneAccessForUser,
  PhoneNotAvailableError,
  PHONE_NOT_AVAILABLE_CODE,
  PHONE_NOT_AVAILABLE_MESSAGE,
  shouldEnforcePhonePresence,
} from '../../services/phonePresenceService';
import type { PhoneVerificationResult } from '../../services/characterPhoneService';

export interface PhonePresenceRequest extends AuthRequest {
  phoneVerification?: PhoneVerificationResult;
}

export async function requirePhonePresence(
  req: PhonePresenceRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const enforce = await shouldEnforcePhonePresence(req.user.userId);
    if (!enforce) {
      next();
      return;
    }

    const headerCtx = parseCharacterContext(req);
    req.phoneVerification = await assertPhoneAccessForUser(req.user.userId, headerCtx);
    next();
  } catch (err) {
    if (err instanceof PhoneNotAvailableError) {
      res.status(403).json({
        success: false,
        error: PHONE_NOT_AVAILABLE_CODE,
        message: PHONE_NOT_AVAILABLE_MESSAGE,
      });
      return;
    }
    next(err);
  }
}
