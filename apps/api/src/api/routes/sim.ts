import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as simController from '../controllers/simController';

const router = Router();

router.post('/initialize', authenticate, simController.initialize);
router.get('/', authenticate, simController.list);
router.post('/refresh', authenticate, simController.refresh);
router.get('/:id', authenticate, simController.get);
router.patch('/:id', authenticate, simController.update);

export default router;
