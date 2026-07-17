import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/channel', authenticate, phase55Controller.getUpdateChannel);
router.get('/check', authenticate, phase55Controller.checkUpdates);
export default router;
