import { Router } from 'express';
import * as controlPanelController from '../controllers/controlPanelController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/health', controlPanelController.health);
router.get('/dashboard', controlPanelController.dashboard);

router.get('/permissions', controlPanelController.permissions);
router.post('/permissions/sync', controlPanelController.syncPermissions);
router.post('/permissions/grant', controlPanelController.grantPermissions);
router.post('/permissions/revoke', controlPanelController.revokePermission);

router.get('/audit', controlPanelController.auditLogs);
router.get('/audit/export', controlPanelController.exportAudit);

router.get('/realtime', controlPanelController.realtime);

router.get('/sessions', controlPanelController.sessions);
router.post('/sessions/revoke', controlPanelController.forceLogoutSession);
router.post('/sessions/revoke-user', controlPanelController.forceLogoutUser);

export default router;
