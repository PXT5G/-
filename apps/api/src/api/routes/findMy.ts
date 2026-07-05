import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/devices', authenticate, phase55Controller.listDevices);
router.post('/devices', authenticate, phase55Controller.registerDevice);
router.post('/devices/:id/lost', authenticate, phase55Controller.markDeviceLost);
export default router;
