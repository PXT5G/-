import { Router } from 'express';
import * as simController from '../controllers/simController';
import * as simAdminController from '../controllers/simAdminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin routes
router.get('/admin/stats', authenticate, requireAdmin, simAdminController.adminStats);
router.get('/admin/sims', authenticate, requireAdmin, simAdminController.adminSearchSims);
router.post('/admin/sims/:id/suspend', authenticate, requireAdmin, simAdminController.adminSuspend);
router.post('/admin/sims/:id/activate', authenticate, requireAdmin, simAdminController.adminActivate);
router.post('/admin/numbers/generate', authenticate, requireAdmin, simAdminController.adminGenerateNumber);
router.get('/admin/audit', authenticate, requireAdmin, simAdminController.adminAuditLogs);
router.get('/admin/carriers', authenticate, requireAdmin, simAdminController.adminManageCarriers);
router.post('/admin/carriers', authenticate, requireAdmin, simAdminController.adminManageCarriers);
router.post('/admin/permissions/grant', authenticate, requireAdmin, simAdminController.adminGrantPermissions);
router.post('/admin/permissions/init', authenticate, requireAdmin, simAdminController.adminInitSelf);

// Permissions init
router.post('/permissions/init', authenticate, simController.initPermissions);
router.get('/permissions', authenticate, simController.getPermissions);

// Provisioning & dashboard
router.post('/provision', authenticate, simController.provision);
router.get('/dashboard', authenticate, simController.getDashboardData);
router.get('/profiles', authenticate, simController.getProfiles);

// SIM lifecycle
router.post('/profiles/:id/activate', authenticate, simController.activate);
router.post('/profiles/:id/deactivate', authenticate, simController.deactivate);
router.post('/profiles/:id/suspend', authenticate, simController.suspend);
router.post('/profiles/:id/replace', authenticate, simController.replace);
router.post('/profiles/:id/change-number', authenticate, simController.changeNumberHandler);

// Phone numbers
router.post('/numbers/generate', authenticate, simController.generateNumber);
router.post('/numbers/reserve', authenticate, simController.reserveNumberHandler);
router.post('/numbers/:id/release', authenticate, simController.releaseNumberHandler);
router.get('/numbers', authenticate, simController.getMyNumbers);
router.get('/numbers/history', authenticate, simController.getNumberHistory);
router.post('/numbers/:id/favorite', authenticate, simController.toggleFavorite);
router.get('/numbers/lookup/:number', authenticate, simController.lookupNumber);

// Settings
router.get('/settings/call', authenticate, simController.getCallSettings);
router.patch('/settings/call', authenticate, simController.updateCallSettings);
router.get('/settings/sms', authenticate, simController.getSMSSettings);
router.patch('/settings/sms', authenticate, simController.updateSMSSettings);
router.post('/settings/sms/backup', authenticate, simController.backupSMS);
router.get('/settings/network', authenticate, simController.getNetwork);
router.patch('/settings/network', authenticate, simController.updateNetwork);
router.post('/settings/network/diagnostic', authenticate, simController.runDiagnostic);
router.get('/settings/voicemail', authenticate, simController.getVoicemail);

// Blocked numbers
router.get('/blocked', authenticate, simController.getBlockedNumbers);
router.post('/blocked', authenticate, simController.addBlockedNumber);
router.delete('/blocked/:id', authenticate, simController.removeBlockedNumber);

// Security
router.get('/security', authenticate, simController.getSecurity);
router.patch('/security', authenticate, simController.updateSecurity);
router.post('/security/pin', authenticate, simController.setPin);
router.post('/security/pin/verify', authenticate, simController.verifyPin);

// Status APIs for other apps
router.get('/carrier/status', authenticate, simController.getCarrierStatus);
router.get('/signal/status', authenticate, simController.getSignalStatus);

// Notifications & audit
router.get('/notifications', authenticate, simController.getNotifications);
router.get('/audit', authenticate, simController.getAuditLogs);

export default router;
