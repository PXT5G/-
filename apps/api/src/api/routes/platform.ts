import { Router } from 'express';
import * as platformController from '../controllers/platformController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/health', authenticate, platformController.platformHealth);

// Identity Bridge
router.get('/identity/context', authenticate, platformController.getIdentityContext);
router.post('/identity/verify', authenticate, platformController.verifyForApp);
router.post('/identity/session/link', authenticate, platformController.linkSession);
router.get('/identity/sessions', authenticate, platformController.getSessions);
router.get('/identity/cross-app/:targetUserId', authenticate, platformController.crossAppLookup);

// Permission Engine
router.post('/permissions/check', authenticate, platformController.checkPermission);
router.get('/permissions', authenticate, platformController.listPermissions);
router.post('/permissions/grant', authenticate, requireAdmin, platformController.grantPermissions);

// Audit System
router.post('/audit/log', authenticate, platformController.pushAuditLog);
router.get('/audit/logs', authenticate, platformController.queryAuditLogs);
router.get('/audit/stats', authenticate, requireAdmin, platformController.auditStats);

// Notification Engine
router.post('/notifications/send', authenticate, platformController.sendNotification);

export default router;
