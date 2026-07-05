import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.post('/initialize', authenticate, phase55Controller.initializeSecurity);
router.get('/dashboard', authenticate, phase55Controller.securityDashboard);
export default router;
