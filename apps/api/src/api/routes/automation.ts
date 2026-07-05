import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as automationController from '../controllers/automationController';

const router = Router();

router.post('/initialize', authenticate, automationController.initialize);
router.get('/', authenticate, automationController.list);
router.post('/', authenticate, automationController.create);
router.get('/history', authenticate, automationController.history);
router.get('/:id', authenticate, automationController.get);
router.patch('/:id', authenticate, automationController.update);
router.delete('/:id', authenticate, automationController.remove);
router.post('/:id/run', authenticate, automationController.run);
router.post('/:id/activate', authenticate, automationController.activate);

export default router;
