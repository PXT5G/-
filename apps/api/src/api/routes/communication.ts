import { Router } from 'express';
import * as communicationController from '../controllers/communicationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, communicationController.initializeHandler);

router.get('/conversations', authenticate, communicationController.getConversationsHandler);
router.post('/conversations', authenticate, communicationController.createConversationHandler);
router.post('/conversations/private', authenticate, communicationController.getOrCreatePrivateHandler);
router.get('/conversations/:id', authenticate, communicationController.getConversationHandler);
router.get('/conversations/:id/members', authenticate, communicationController.getConversationMembersHandler);
router.post('/conversations/:id/members', authenticate, communicationController.addMemberHandler);
router.get('/conversations/:id/messages', authenticate, communicationController.getMessagesHandler);
router.post('/conversations/:id/read', authenticate, communicationController.markConversationReadHandler);
router.post('/conversations/:id/typing/start', authenticate, communicationController.startTypingHandler);
router.post('/conversations/:id/typing/stop', authenticate, communicationController.stopTypingHandler);
router.get('/conversations/:id/typing', authenticate, communicationController.getTypingHandler);
router.post('/conversations/:conversationId/messages/:messageId/pin', authenticate, communicationController.pinMessageHandler);

router.post('/messages', authenticate, communicationController.sendMessageHandler);
router.get('/messages/:id', authenticate, communicationController.getMessageHandler);
router.patch('/messages/:id', authenticate, communicationController.editMessageHandler);
router.post('/messages/:id/delete-me', authenticate, communicationController.deleteForMeHandler);
router.post('/messages/:id/delete-everyone', authenticate, communicationController.deleteForEveryoneHandler);
router.post('/messages/:id/forward', authenticate, communicationController.forwardMessageHandler);
router.post('/conversations/:conversationId/messages/:messageId/read', authenticate, communicationController.markReadHandler);
router.post('/messages/:messageId/reactions', authenticate, communicationController.addReactionHandler);
router.delete('/messages/:messageId/reactions', authenticate, communicationController.removeReactionHandler);

router.get('/presence', authenticate, communicationController.getPresenceHandler);
router.patch('/presence', authenticate, communicationController.setPresenceHandler);
router.patch('/presence/invisible', authenticate, communicationController.setInvisibleHandler);
router.patch('/presence/dnd', authenticate, communicationController.setDndHandler);

router.post('/attachments/initiate', authenticate, communicationController.initiateUploadHandler);
router.post('/attachments/:id/chunks/:chunkIndex', authenticate, communicationController.uploadChunkHandler);
router.get('/attachments/:id', authenticate, communicationController.getAttachmentHandler);

router.get('/search', authenticate, communicationController.searchHandler);

router.post('/sync/queue', authenticate, communicationController.queueOfflineHandler);
router.post('/sync', authenticate, communicationController.syncHandler);
router.get('/sync/status', authenticate, communicationController.syncStatusHandler);
router.post('/sync/resolve', authenticate, communicationController.resolveConflictHandler);

router.post('/devices/register', authenticate, communicationController.registerDeviceHandler);

router.post('/announcements', authenticate, communicationController.createAnnouncementHandler);

export default router;
