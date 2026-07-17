import { Request, Response, NextFunction } from 'express';
import { IDEMPOTENCY_HEADER } from '../../constants/serviceAuth';
import { getIdempotentResponse, storeIdempotentResponse } from '../../services/idempotencyService';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!IDEMPOTENT_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const rawKey = req.headers[IDEMPOTENCY_HEADER];
  const key = typeof rawKey === 'string' ? rawKey.trim() : Array.isArray(rawKey) ? rawKey[0]?.trim() : '';
  if (!key || key.length < 8 || key.length > 128) {
    next();
    return;
  }

  const path = req.baseUrl + req.path;

  void (async () => {
    try {
      const cached = await getIdempotentResponse<Record<string, unknown>>(key, req.method, path);
      if (cached) {
        res.status(cached.statusCode).json(cached.body);
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = (body: Record<string, unknown>) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body && typeof body === 'object') {
          void storeIdempotentResponse(key, req.method, path, res.statusCode, body).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  })();
}
