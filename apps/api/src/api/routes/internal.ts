import { Router } from 'express';
import { authenticateService } from '../middleware/serviceAuth';
import * as internalController from '../controllers/internalController';

const router = Router();

router.get('/health', internalController.getHealth);
router.post('/heartbeat', authenticateService, internalController.postHeartbeat);
router.get('/services', authenticateService, internalController.getServices);

export default router;
