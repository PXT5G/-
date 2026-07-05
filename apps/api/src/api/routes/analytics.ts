import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/center', authenticate, phase55Controller.analyticsCenter);
export default router;
