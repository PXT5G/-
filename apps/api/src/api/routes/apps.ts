import { Router } from 'express';
import * as appController from '../controllers/appController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/catalog', authenticate, appController.getCatalog);
router.get('/installed', authenticate, appController.getInstalled);
router.post('/install/:bundleId', authenticate, appController.installApp);
router.delete('/uninstall/:bundleId', authenticate, appController.uninstallApp);
router.put('/layout', authenticate, appController.updateLayout);

export default router;
