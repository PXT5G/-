import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/backups', authenticate, phase55Controller.listBackups);
router.post('/backups', authenticate, phase55Controller.createBackup);
router.post('/backups/:id/restore', authenticate, phase55Controller.restoreBackup);
router.post('/sync', authenticate, phase55Controller.syncCloud);
export default router;
