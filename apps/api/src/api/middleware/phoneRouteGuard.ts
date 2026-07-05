import type { RequestHandler, Router } from 'express';
import { authenticate } from './auth';
import { requirePhonePresence } from './phonePresence';

/** Applies JWT auth + centralized phone presence validation before route handlers */
export function withPhonePresenceGuard(router: Router): RequestHandler[] {
  return [authenticate, requirePhonePresence, router];
}
