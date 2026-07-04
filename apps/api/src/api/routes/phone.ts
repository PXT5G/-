import { Router } from 'express';
import * as phoneController from '../controllers/phoneController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Permissions & init
router.get('/permissions', authenticate, phoneController.getPermissions);
router.post('/permissions/init', authenticate, phoneController.initPermissions);

// Dashboard & settings
router.get('/dashboard', authenticate, phoneController.getDashboardData);
router.get('/settings', authenticate, phoneController.getSettings);
router.patch('/settings', authenticate, phoneController.patchSettings);
router.get('/audit/logs', authenticate, phoneController.auditLogs);

// Favorites
router.get('/favorites', authenticate, phoneController.getFavorites);
router.post('/favorites', authenticate, phoneController.postFavorite);
router.delete('/favorites/:id', authenticate, phoneController.deleteFavorite);
router.post('/favorites/reorder', authenticate, phoneController.reorderFavoritesHandler);

// Blocked numbers
router.get('/blocked', authenticate, phoneController.getBlocked);
router.post('/blocked', authenticate, phoneController.postBlocked);
router.delete('/blocked/:id', authenticate, phoneController.deleteBlocked);

// Contacts search
router.get('/contacts/search', authenticate, phoneController.searchContactsHandler);

// Active call & history
router.get('/calls/active', authenticate, phoneController.getActiveCallHandler);
router.get('/calls/history', authenticate, phoneController.getHistory);
router.get('/calls/missed', authenticate, phoneController.getMissed);
router.post('/calls', authenticate, phoneController.postCall);
router.post('/calls/:id/accept', authenticate, phoneController.acceptCallHandler);
router.post('/calls/:id/reject', authenticate, phoneController.rejectCallHandler);
router.post('/calls/:id/end', authenticate, phoneController.endCallHandler);
router.post('/calls/:id/hold', authenticate, phoneController.holdCallHandler);
router.post('/calls/:id/resume', authenticate, phoneController.resumeCallHandler);
router.post('/calls/:id/mute', authenticate, phoneController.muteCallHandler);
router.post('/calls/:id/speaker', authenticate, phoneController.speakerCallHandler);
router.post('/calls/:id/conference', authenticate, phoneController.conferenceHandler);
router.post('/calls/:id/record', authenticate, phoneController.recordCallHandler);
router.post('/calls/:id/voicemail', authenticate, phoneController.voicemailRedirectHandler);

// Voicemail
router.get('/voicemail', authenticate, phoneController.getVoicemailsHandler);
router.get('/voicemail/:id', authenticate, phoneController.getVoicemailHandler);
router.post('/voicemail/:id/read', authenticate, phoneController.readVoicemailHandler);
router.delete('/voicemail/:id', authenticate, phoneController.deleteVoicemailHandler);
router.post('/voicemail/greeting', authenticate, phoneController.voicemailGreetingHandler);

// Emergency
router.get('/emergency', authenticate, phoneController.getEmergencyContacts);
router.post('/emergency', authenticate, phoneController.postEmergencyContact);
router.delete('/emergency/:id', authenticate, phoneController.deleteEmergencyContact);
router.post('/emergency/sync', authenticate, phoneController.syncEmergencyContacts);
router.post('/emergency/call', authenticate, phoneController.emergencyCallHandler);
router.post('/emergency/:id/call', authenticate, phoneController.callEmergencyContactHandler);

export default router;
