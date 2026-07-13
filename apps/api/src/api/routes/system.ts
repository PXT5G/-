import { Router } from 'express';
import * as systemController from '../controllers/systemController';
import * as phoneOsController from '../controllers/phoneOsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/ready', authenticate, systemController.systemReadyHandler);

router.get('/geo', authenticate, systemController.getRealGeoHandler);
router.get('/location', authenticate, systemController.getLocationHandler);
router.post('/location/refresh', authenticate, systemController.refreshLocationHandler);
router.patch('/location', authenticate, systemController.setLocationEnabledHandler);

router.get('/network', authenticate, systemController.getNetworkHandler);
router.post('/network/refresh', authenticate, systemController.refreshNetworkHandler);
router.patch('/network', authenticate, systemController.updateNetworkHandler);

router.get('/device', authenticate, systemController.getDeviceStateHandler);
router.post('/device/refresh', authenticate, systemController.refreshDeviceStateHandler);
router.patch('/device/screen', authenticate, systemController.setScreenStateHandler);
router.patch('/device/lock', authenticate, systemController.setLockStateHandler);

router.get('/jobs', authenticate, systemController.getJobsHandler);
router.get('/jobs/stats', authenticate, systemController.getJobStatsHandler);
router.get('/jobs/:id', authenticate, systemController.getJobHandler);
router.post('/jobs', authenticate, systemController.createJobHandler);
router.post('/jobs/:id/cancel', authenticate, systemController.cancelJobHandler);

router.post('/events', authenticate, systemController.publishEventHandler);
router.get('/events/replay', authenticate, systemController.replayEventsHandler);

router.get('/permissions', authenticate, systemController.getPermissionsHandler);
router.post('/permissions/grant', authenticate, systemController.grantPermissionHandler);
router.post('/permissions/revoke', authenticate, systemController.revokePermissionHandler);
router.post('/permissions/request', authenticate, systemController.requestPermissionHandler);
router.get('/permissions/:appId/:permission', authenticate, systemController.checkPermissionHandler);

router.post('/notifications', authenticate, systemController.enqueueNotificationHandler);
router.get('/notifications/queue', authenticate, systemController.getNotificationQueueHandler);
router.post('/notifications/:id/read', authenticate, systemController.markBrokerNotificationRead);
router.post('/notifications/:id/dismiss', authenticate, systemController.dismissBrokerNotification);

router.get('/diagnostics', authenticate, systemController.getDiagnosticsHandler);
router.post('/diagnostics/collect', authenticate, systemController.collectDiagnosticsHandler);
router.get('/diagnostics/history', authenticate, systemController.getDiagnosticsHistoryHandler);
router.get('/diagnostics/tasks', authenticate, systemController.getBackgroundTasksHandler);

router.get('/search', authenticate, phoneOsController.globalSearchHandler);

export default router;
