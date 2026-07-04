import { Router } from 'express';
import * as deviceController from '../controllers/deviceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/storage', authenticate, deviceController.getStorage);
router.post('/storage/recalculate', authenticate, deviceController.recalcStorage);
router.patch('/storage/capacity', authenticate, deviceController.setCapacity);
router.get('/storage/capacity-tiers', authenticate, deviceController.getCapacityTiers);
router.get('/storage/largest-apps', authenticate, deviceController.getLargestAppsHandler);
router.get('/storage/packages', authenticate, deviceController.getPackages);
router.post('/storage/clear-cache', authenticate, deviceController.clearDeviceCache);
router.post('/storage/apps/:bundleId/clear-cache', authenticate, deviceController.clearAppCacheHandler);
router.get('/storage/check/:bundleId', authenticate, deviceController.checkStorageForInstall);

export default router;
