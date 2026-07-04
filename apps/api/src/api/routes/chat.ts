import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as chatController from '../controllers/chatController';

const router = Router();

router.post('/initialize', authenticate, chatController.initialize);
router.get('/inbox', authenticate, chatController.inbox);
router.get('/search', authenticate, chatController.search);

router.post('/conversations/private', authenticate, chatController.createPrivate);
router.post('/conversations/group', authenticate, chatController.createGroup);
router.post('/conversations/channel', authenticate, chatController.createChannel);
router.post('/conversations/community', authenticate, chatController.createCommunity);
router.post('/conversations/broadcast', authenticate, chatController.createBroadcast);
router.get('/conversations/:conversationId', authenticate, chatController.getConversation);
router.patch('/conversations/:conversationId/meta', authenticate, chatController.updateMeta);
router.post('/conversations/:conversationId/pin', authenticate, chatController.pinConversation);
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);
router.post('/conversations/:conversationId/messages', authenticate, chatController.sendMessage);
router.post('/conversations/:conversationId/messages/rich', authenticate, chatController.sendRichMessage);
router.post('/conversations/:conversationId/messages/:messageId/pin', authenticate, chatController.pinMessage);
router.post('/conversations/:conversationId/typing', authenticate, chatController.typing);
router.post('/conversations/:conversationId/invite', authenticate, chatController.createInvite);
router.get('/conversations/:conversationId/join-requests', authenticate, chatController.joinRequests);
router.post('/conversations/:conversationId/join-requests', authenticate, chatController.createJoinRequest);

router.patch('/messages/:messageId', authenticate, chatController.editMessage);
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);
router.post('/messages/:messageId/forward', authenticate, chatController.forwardMessage);
router.post('/messages/:messageId/reactions', authenticate, chatController.addReaction);
router.delete('/messages/:messageId/reactions', authenticate, chatController.removeReaction);

router.get('/message-requests', authenticate, chatController.messageRequests);
router.post('/message-requests', authenticate, chatController.sendMessageRequest);
router.post('/message-requests/:requestId/respond', authenticate, chatController.respondMessageRequest);

router.post('/polls', authenticate, chatController.createPoll);
router.post('/polls/:pollId/vote', authenticate, chatController.votePoll);

router.get('/stickers', authenticate, chatController.stickers);

router.get('/blocked', authenticate, chatController.blockedUsers);
router.post('/blocked', authenticate, chatController.blockUser);
router.delete('/blocked/:userId', authenticate, chatController.unblockUser);

router.get('/privacy', authenticate, chatController.privacy);
router.patch('/privacy', authenticate, chatController.updatePrivacy);

router.post('/calls', authenticate, chatController.startCall);
router.patch('/calls/:callId', authenticate, chatController.updateCall);
router.post('/calls/:callId/end', authenticate, chatController.endCall);
router.get('/calls/history', authenticate, chatController.callHistory);

router.post('/invites/join', authenticate, chatController.joinInvite);
router.post('/join-requests/:requestId/review', authenticate, chatController.reviewJoinRequest);

router.get('/devices/trusted', authenticate, chatController.trustedDevices);
router.get('/presence', authenticate, chatController.presence);
router.patch('/presence', authenticate, chatController.updatePresence);

router.patch('/profile', authenticate, chatController.updateProfile);
router.get('/rbac', authenticate, chatController.rbac);
router.patch('/rbac', authenticate, chatController.updateRbac);

export default router;
