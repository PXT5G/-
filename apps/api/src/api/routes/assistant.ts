import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as assistantController from '../controllers/assistantController';

const router = Router();

router.post('/initialize', authenticate, assistantController.initialize);
router.get('/conversations', authenticate, assistantController.conversations);
router.post('/conversations', authenticate, assistantController.createConversation);
router.get('/conversations/:id/messages', authenticate, assistantController.getMessages);
router.post('/conversations/:id/messages', authenticate, assistantController.sendMessage);
router.delete('/conversations/:id', authenticate, assistantController.deleteConversation);
router.post('/actions/:id/confirm', authenticate, assistantController.confirmAction);

export default router;
