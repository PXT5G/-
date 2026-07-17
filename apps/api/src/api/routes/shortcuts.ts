import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as shortcutsController from '../controllers/shortcutsController';

const router = Router();
router.post('/initialize', authenticate, shortcutsController.initialize);
router.get('/', authenticate, shortcutsController.list);
router.get('/history', authenticate, shortcutsController.history);
router.post('/', authenticate, shortcutsController.create);
router.get('/:id', authenticate, shortcutsController.get);
router.patch('/:id', authenticate, shortcutsController.update);
router.delete('/:id', authenticate, shortcutsController.remove);
router.post('/:id/run', authenticate, shortcutsController.run);
export default router;
