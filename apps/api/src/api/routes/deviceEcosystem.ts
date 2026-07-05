import { Router } from 'express';
import * as deviceEcosystemController from '../controllers/deviceEcosystemController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, deviceEcosystemController.initializeHandler);

router.get('/profile', authenticate, deviceEcosystemController.getProfileHandler);
router.patch('/profile', authenticate, deviceEcosystemController.updateProfileHandler);

router.get('/power', authenticate, deviceEcosystemController.getPowerHandler);
router.post('/power/charging', authenticate, deviceEcosystemController.setChargingHandler);
router.patch('/power/mode', authenticate, deviceEcosystemController.setPowerModeHandler);

router.get('/security', authenticate, deviceEcosystemController.getSecurityHandler);
router.patch('/security', authenticate, deviceEcosystemController.updateSecurityHandler);
router.post('/security/unlock', authenticate, deviceEcosystemController.unlockHandler);
router.post('/security/trusted-devices', authenticate, deviceEcosystemController.addTrustedDeviceHandler);
router.post('/security/remote-lock', authenticate, deviceEcosystemController.remoteLockHandler);
router.post('/security/remote-wipe', authenticate, deviceEcosystemController.remoteWipeHandler);

router.get('/storage', authenticate, deviceEcosystemController.getExpandedStorageHandler);
router.post('/storage/cleanup', authenticate, deviceEcosystemController.storageCleanupHandler);
router.post('/storage/empty-trash', authenticate, deviceEcosystemController.emptyTrashHandler);
router.get('/storage/duplicates', authenticate, deviceEcosystemController.detectDuplicatesHandler);

router.post('/backup', authenticate, deviceEcosystemController.createBackupHandler);
router.get('/backup', authenticate, deviceEcosystemController.getBackupHistoryHandler);
router.get('/backup/queue', authenticate, deviceEcosystemController.getBackupQueueHandler);
router.post('/backup/:backupId/restore', authenticate, deviceEcosystemController.restoreBackupHandler);

router.post('/sync', authenticate, deviceEcosystemController.startSyncHandler);
router.get('/sync', authenticate, deviceEcosystemController.getSyncHistoryHandler);
router.get('/sync/status', authenticate, deviceEcosystemController.getSyncStatusHandler);

router.post('/diagnostics', authenticate, deviceEcosystemController.collectDiagnosticsHandler);
router.get('/diagnostics/history', authenticate, deviceEcosystemController.getDiagnosticsHistoryHandler);

router.post('/maintenance', authenticate, deviceEcosystemController.runMaintenanceHandler);
router.get('/maintenance', authenticate, deviceEcosystemController.getMaintenanceHistoryHandler);

router.get('/developer', authenticate, deviceEcosystemController.getDeveloperDashboardHandler);
router.get('/developer/logs', authenticate, deviceEcosystemController.getDeveloperLogsHandler);
router.get('/developer/api', authenticate, deviceEcosystemController.getApiInspectorHandler);
router.get('/developer/sockets', authenticate, deviceEcosystemController.getSocketInspectorHandler);
router.get('/developer/permissions', authenticate, deviceEcosystemController.getPermissionViewerHandler);
router.get('/developer/storage', authenticate, deviceEcosystemController.getStorageViewerHandler);
router.get('/developer/network', authenticate, deviceEcosystemController.getNetworkViewerHandler);

router.get('/recovery', authenticate, deviceEcosystemController.getRecoveryHandler);
router.patch('/recovery/mode', authenticate, deviceEcosystemController.setRecoveryModeHandler);
router.post('/recovery/rollback', authenticate, deviceEcosystemController.rollbackHandler);
router.post('/recovery/factory-reset', authenticate, deviceEcosystemController.factoryResetHandler);
router.post('/recovery/restore/:backupId', authenticate, deviceEcosystemController.recoveryRestoreHandler);

export default router;
