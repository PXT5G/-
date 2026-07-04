import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import * as phoneOsController from '../controllers/phoneOsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, settingsController.getSettings);
router.patch('/', authenticate, settingsController.updateSettings);
router.post('/reset', authenticate, settingsController.resetSettings);
router.get('/languages', authenticate, settingsController.listLanguages);
router.get('/about', authenticate, settingsController.getAbout);
router.get('/translations/:code', authenticate, settingsController.getTranslations);

router.get('/phone-os', authenticate, phoneOsController.getConfigsHandler);
router.patch('/phone-os/control-center', authenticate, phoneOsController.updateControlCenterHandler);
router.patch('/phone-os/lock-screen', authenticate, phoneOsController.updateLockScreenHandler);
router.patch('/phone-os/status-bar', authenticate, phoneOsController.updateStatusBarHandler);
router.patch('/phone-os/wallpaper', authenticate, phoneOsController.updateWallpaperHandler);
router.patch('/phone-os/widgets', authenticate, phoneOsController.updateWidgetLayoutHandler);
router.patch('/phone-os/notifications', authenticate, phoneOsController.updateNotificationPrefsHandler);
router.patch('/phone-os/accessibility', authenticate, phoneOsController.updateAccessibilityHandler);

export default router;
