import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phoneController from '../controllers/phoneController';

const router = Router();

router.post('/initialize', authenticate, phoneController.initialize);
router.get('/calls', authenticate, phoneController.getCalls);
router.post('/calls', authenticate, phoneController.initiateCall);
router.post('/calls/incoming', authenticate, phoneController.simulateIncoming);
router.patch('/calls/:id/answer', authenticate, phoneController.answerCall);
router.patch('/calls/:id/end', authenticate, phoneController.endCall);
router.patch('/calls/:id', authenticate, phoneController.updateCall);
router.get('/statistics', authenticate, phoneController.getStatistics);
router.get('/favorites', authenticate, phoneController.getFavorites);
router.post('/favorites', authenticate, phoneController.addFavorite);
router.delete('/favorites/:id', authenticate, phoneController.removeFavorite);
router.get('/blocked', authenticate, phoneController.getBlocked);
router.post('/blocked', authenticate, phoneController.blockNumber);
router.delete('/blocked/:id', authenticate, phoneController.unblockNumber);
router.get('/voicemail', authenticate, phoneController.getVoicemail);
router.patch('/voicemail/:id/read', authenticate, phoneController.markVoicemailRead);
router.get('/directory', authenticate, phoneController.getDirectory);
router.get('/export', authenticate, phoneController.exportCalls);

export default router;
