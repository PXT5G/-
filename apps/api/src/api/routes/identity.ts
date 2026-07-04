import { Router } from 'express';
import * as identityController from '../controllers/identityController';
import * as identityAdminController from '../controllers/identityAdminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin routes (must be before parameterized routes)
router.get('/admin/queue', authenticate, requireAdmin, identityAdminController.getVerificationQueue);
router.get('/admin/search', authenticate, requireAdmin, identityAdminController.adminSearch);
router.get('/admin/stats', authenticate, requireAdmin, identityAdminController.adminStats);
router.get('/admin/audit', authenticate, requireAdmin, identityAdminController.adminAuditLogs);
router.get('/admin/:id', authenticate, requireAdmin, identityAdminController.adminGetIdentity);
router.post('/admin/:id/approve', authenticate, requireAdmin, identityAdminController.adminApprove);
router.post('/admin/:id/reject', authenticate, requireAdmin, identityAdminController.adminReject);
router.post('/admin/:id/suspend', authenticate, requireAdmin, identityAdminController.adminSuspend);
router.post('/admin/:id/reactivate', authenticate, requireAdmin, identityAdminController.adminReactivate);

// User identity routes
router.post('/', authenticate, identityController.createIdentity);
router.get('/me', authenticate, identityController.getMyIdentity);
router.patch('/me', authenticate, identityController.updateMyIdentity);
router.get('/me/pdf', authenticate, identityController.downloadPdf);
router.get('/me/qr', authenticate, identityController.generateQr);
router.get('/me/permissions', authenticate, identityController.getPermissions);
router.post('/me/permissions', authenticate, identityController.addPermission);
router.delete('/me/permissions/:appId/:permission', authenticate, identityController.removePermission);
router.get('/me/sessions', authenticate, identityController.getSessions);
router.delete('/me/sessions/:sessionId', authenticate, identityController.revokeSession);
router.get('/me/settings', authenticate, identityController.getSettings);
router.patch('/me/settings', authenticate, identityController.updateSettings);
router.post('/me/settings/pin', authenticate, identityController.setPin);
router.post('/me/settings/pin/verify', authenticate, identityController.verifyPin);
router.get('/me/devices', authenticate, identityController.getTrustedDevices);
router.post('/me/devices', authenticate, identityController.addTrustedDevice);
router.delete('/me/devices/:deviceId', authenticate, identityController.removeTrustedDevice);
router.get('/me/verification-history', authenticate, identityController.getVerificationHistory);
router.get('/me/history', authenticate, identityController.getIdentityHistory);
router.get('/me/security-logs', authenticate, identityController.getSecurityLogs);
router.post('/me/temp-pass', authenticate, identityController.createTempPass);
router.get('/me/notifications', authenticate, identityController.getNotifications);
router.get('/me/stats', authenticate, identityController.getStats);
router.post('/me/share', authenticate, identityController.shareIdentity);

// Verification & search
router.post('/verify', authenticate, identityController.verifyIdentity);
router.get('/search', authenticate, identityController.searchIdentities);
router.get('/:nationalId', authenticate, identityController.getIdentityByNationalId);

export default router;
