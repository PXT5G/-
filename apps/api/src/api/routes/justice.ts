import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { lookupPoliceCase, lookupPoliceVehicle, initializeJusticePermissions } from '../../services/justiceService';
import { permissionEngineService } from '../../platform';
import { BANANAOS_APP_IDS } from '@bananaos/shared';

const router = Router();

router.get('/health', authenticate, asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { appId: BANANAOS_APP_IDS.JUSTICE, status: 'connected_to_platform' } });
}));

router.post('/permissions/init', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await initializeJusticePermissions(req.user!.userId, req.user!.userId);
  const perms = await permissionEngineService.listPermissions(BANANAOS_APP_IDS.JUSTICE, req.user!.userId);
  res.json({ success: true, data: perms });
}));

router.get('/lookup/cases', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  const cases = await lookupPoliceCase(req.user!.userId, q, req.user!.role);
  res.json({ success: true, data: cases });
}));

router.get('/lookup/vehicles', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  const vehicles = await lookupPoliceVehicle(req.user!.userId, q, req.user!.role);
  res.json({ success: true, data: vehicles });
}));

export default router;
