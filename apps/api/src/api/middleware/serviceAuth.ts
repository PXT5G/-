import { Request, Response, NextFunction } from 'express';
import { SERVICE_AUTH_HEADER } from '../../constants/serviceAuth';
import { isServiceAuthConfigured, verifyServiceToken } from '../../services/serviceAuthService';

export interface ServiceAuthRequest extends Request {
  serviceAuth?: { authenticated: true };
}

export function authenticateService(
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!isServiceAuthConfigured()) {
    res.status(503).json({
      success: false,
      error: 'Service authentication is not configured',
    });
    return;
  }

  const headerToken = req.headers[SERVICE_AUTH_HEADER];
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = (typeof headerToken === 'string' ? headerToken : Array.isArray(headerToken) ? headerToken[0] : undefined) ?? bearer;

  if (!verifyServiceToken(token)) {
    res.status(401).json({ success: false, error: 'Invalid service token' });
    return;
  }

  req.serviceAuth = { authenticated: true };
  next();
}
