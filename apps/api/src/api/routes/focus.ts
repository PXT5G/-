import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as focusController from '../controllers/focusController';

const router = Router();
router.post('/initialize', authenticate, focusController.initialize);
router.get('/', authenticate, focusController.list);
router.get('/active', authenticate, focusController.active);
router.post('/', authenticate, focusController.create);
router.post('/disable', authenticate, focusController.disable);
router.post('/:id/enable', authenticate, focusController.enable);
router.patch('/:id', authenticate, focusController.update);
export default router;
