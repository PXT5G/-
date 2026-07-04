import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, settingsController.getSettings);
router.patch('/', authenticate, settingsController.updateSettings);
router.post('/reset', authenticate, settingsController.resetSettings);
router.get('/languages', authenticate, settingsController.listLanguages);
router.get('/about', authenticate, settingsController.getAbout);
router.get('/translations/:code', authenticate, settingsController.getTranslations);

export default router;
