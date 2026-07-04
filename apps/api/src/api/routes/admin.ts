import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/broadcast', adminController.broadcast);
router.post('/seed', adminController.seedSystemApps);

export default router;
