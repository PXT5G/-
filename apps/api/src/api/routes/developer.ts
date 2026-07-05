import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/dashboard', authenticate, phase55Controller.developerDashboard);
export default router;
