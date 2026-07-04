import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as mailController from '../controllers/mailController';

const router = Router();

router.post('/initialize', authenticate, mailController.initialize);
router.get('/accounts', authenticate, mailController.listAccounts);
router.get('/messages', authenticate, mailController.listMessages);
router.get('/search', authenticate, mailController.search);
router.post('/send', authenticate, mailController.send);
router.patch('/messages/:id', authenticate, mailController.update);
router.delete('/messages/:id', authenticate, mailController.remove);

export default router;
