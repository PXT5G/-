import { config } from '../config.js';

/**
 * مصادقة API — MDT Web و FiveM يرسلان:
 *   Authorization: Bearer <API_SECRET>
 */
export function apiAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-api-secret'];
  if (!token || token !== config.api.secret) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  next();
}
