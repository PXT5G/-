import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as discordController from '../controllers/discordController';

const router = Router();

router.get('/preferences', authenticate, discordController.getPreferences);
router.patch('/preferences', authenticate, discordController.patchPreferences);

export default router;
