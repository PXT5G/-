import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as contactsController from '../controllers/contactsController';

const router = Router();

router.post('/initialize', authenticate, contactsController.initialize);
router.get('/', authenticate, contactsController.list);
router.get('/duplicates', authenticate, contactsController.duplicates);
router.post('/merge', authenticate, contactsController.merge);
router.get('/:id', authenticate, contactsController.get);
router.post('/', authenticate, contactsController.create);
router.patch('/:id', authenticate, contactsController.update);
router.delete('/:id', authenticate, contactsController.remove);

export default router;
