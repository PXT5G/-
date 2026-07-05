import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as personalizationController from '../controllers/personalizationController';

const router = Router();

router.post('/initialize', authenticate, personalizationController.initialize);
router.get('/themes', authenticate, personalizationController.themes);
router.post('/themes/:id/activate', authenticate, personalizationController.activateTheme);
router.get('/wallpapers', authenticate, personalizationController.wallpapers);
router.get('/layouts', authenticate, personalizationController.layouts);
router.patch('/layouts/:id', authenticate, personalizationController.updateLayout);
router.get('/lock-screen', authenticate, personalizationController.lockScreenProfiles);
router.post('/lock-screen/:id/activate', authenticate, personalizationController.activateLockScreen);
router.post('/handoff', authenticate, personalizationController.startHandoff);
router.post('/clipboard', authenticate, personalizationController.syncClipboard);
router.get('/clipboard', authenticate, personalizationController.getClipboard);
router.get('/performance', authenticate, personalizationController.performanceSnapshot);

export default router;
