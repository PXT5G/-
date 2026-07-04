import { Router } from 'express';
import * as deviceController from '../controllers/deviceController';
import deviceEcosystemRoutes from './deviceEcosystem';
import phoneOsRoutes from './phoneOs';
import premiumExperienceRoutes from './premiumExperience';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use('/ecosystem', deviceEcosystemRoutes);
router.use('/phone', phoneOsRoutes);
router.use('/premium', premiumExperienceRoutes);

router.get('/storage', authenticate, deviceController.getStorage);
router.post('/storage/recalculate', authenticate, deviceController.recalcStorage);
router.patch('/storage/capacity', authenticate, deviceController.setCapacity);
router.get('/storage/capacity-tiers', authenticate, deviceController.getCapacityTiers);
router.get('/storage/largest-apps', authenticate, deviceController.getLargestAppsHandler);
router.get('/storage/packages', authenticate, deviceController.getPackages);
router.post('/storage/clear-cache', authenticate, deviceController.clearDeviceCache);
router.post('/storage/apps/:bundleId/clear-cache', authenticate, deviceController.clearAppCacheHandler);
router.get('/storage/check/:bundleId', authenticate, deviceController.checkStorageForInstall);

router.get('/hardware', authenticate, deviceController.getHardware);
router.post('/hardware/temperature', authenticate, deviceController.refreshTemperature);
router.get('/ram', authenticate, deviceController.getRam);
router.get('/task-manager', authenticate, deviceController.getTaskManagerHandler);
router.post('/ram/launch/:bundleId', authenticate, deviceController.launchAppHandler);
router.post('/ram/background/:bundleId', authenticate, deviceController.backgroundAppHandler);
router.post('/ram/stop/:bundleId', authenticate, deviceController.stopAppHandler);
router.post('/ram/force-stop/:bundleId', authenticate, deviceController.forceStopAppHandler);
router.get('/low-storage', authenticate, deviceController.getLowStorageStatus);
router.get('/trash', authenticate, deviceController.getTrashHandler);
router.post('/trash/empty', authenticate, deviceController.emptyTrashHandler);
router.post('/system-update', authenticate, deviceController.systemUpdateHandler);

export default router;
