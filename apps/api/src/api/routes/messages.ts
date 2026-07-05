import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as messagesController from '../controllers/messagesController';

const router = Router();

router.post('/initialize', authenticate, messagesController.initialize);
router.get('/conversations', authenticate, messagesController.listConversations);
router.get('/search', authenticate, messagesController.search);
router.get('/conversations/:conversationId/messages', authenticate, messagesController.getMessages);
router.post('/send', authenticate, messagesController.send);
router.post('/conversations/:conversationId/typing', authenticate, messagesController.typing);

export default router;
