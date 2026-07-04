import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../services/jwtService';
import { AuthRequest } from '../middleware/auth';

export function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Invalid token — continue as guest
  }
  next();
}
