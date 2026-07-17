import { Router } from 'express';
import * as phoneOsController from '../controllers/phoneOsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, phoneOsController.initializeHandler);
router.get('/info', authenticate, phoneOsController.getDeviceInfoHandler);
router.post('/power', authenticate, phoneOsController.powerActionHandler);
router.post('/charging/start', authenticate, phoneOsController.startChargingHandler);
router.post('/charging/stop', authenticate, phoneOsController.stopChargingHandler);
router.get('/battery', authenticate, phoneOsController.getBatteryHandler);
router.get('/performance', authenticate, phoneOsController.getPerformanceHandler);
router.patch('/performance/mode', authenticate, phoneOsController.setPerformanceModeHandler);
router.post('/background/:bundleId/freeze', authenticate, phoneOsController.freezeAppHandler);
router.post('/background/:bundleId/pin', authenticate, phoneOsController.pinAppHandler);
router.get('/diagnostics', authenticate, phoneOsController.diagnosticsHandler);

router.get('/configs', authenticate, phoneOsController.getConfigsHandler);
router.patch('/configs/control-center', authenticate, phoneOsController.updateControlCenterHandler);
router.patch('/configs/lock-screen', authenticate, phoneOsController.updateLockScreenHandler);
router.patch('/configs/status-bar', authenticate, phoneOsController.updateStatusBarHandler);
router.patch('/configs/wallpaper', authenticate, phoneOsController.updateWallpaperHandler);
router.patch('/configs/widgets', authenticate, phoneOsController.updateWidgetLayoutHandler);
router.patch('/configs/notifications', authenticate, phoneOsController.updateNotificationPrefsHandler);
router.patch('/configs/accessibility', authenticate, phoneOsController.updateAccessibilityHandler);

router.get('/live-activities', authenticate, phoneOsController.getLiveActivitiesHandler);
router.get('/live-activities/history', authenticate, phoneOsController.getLiveActivityHistoryHandler);
router.post('/live-activities', authenticate, phoneOsController.createLiveActivityHandler);
router.patch('/live-activities/:activityId', authenticate, phoneOsController.updateLiveActivityHandler);
router.post('/live-activities/:activityId/end', authenticate, phoneOsController.endLiveActivityHandler);

export default router;
