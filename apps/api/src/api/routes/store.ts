import { Router } from 'express';
import * as storeController from '../controllers/storeController';
import { authenticate } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public browse
router.get('/featured', optionalAuthenticate, storeController.getFeatured);
router.get('/trending', optionalAuthenticate, storeController.getTrending);
router.get('/recommended', optionalAuthenticate, storeController.getRecommended);
router.get('/editors-choice', optionalAuthenticate, storeController.getEditorsChoice);
router.get('/categories', storeController.getCategories);
router.get('/categories/:category', optionalAuthenticate, storeController.getByCategory);
router.get('/search', optionalAuthenticate, storeController.search);
router.get('/developers/:slug', storeController.getDeveloper);
router.get('/apps/:bundleId', optionalAuthenticate, storeController.getAppDetail);
router.get('/apps/:bundleId/reviews', storeController.getReviews);
router.get('/apps/:bundleId/manifest', optionalAuthenticate, storeController.getPackageManifestHandler);

// Authenticated actions
router.post('/apps/:bundleId/reviews', authenticate, storeController.postReview);
router.post('/apps/:bundleId/install', authenticate, storeController.installApp);
router.post('/downloads/:downloadId/complete', authenticate, storeController.completeInstall);
router.delete('/apps/:bundleId/uninstall', authenticate, storeController.uninstallApp);
router.post('/apps/:bundleId/update', authenticate, storeController.updateApp);
router.post('/apps/:bundleId/start-update', authenticate, storeController.startUpdateHandler);
router.post('/downloads/:downloadId/complete-update', authenticate, storeController.completeUpdate);
router.post('/downloads/:downloadId/pause', authenticate, storeController.pauseDownloadHandler);
router.post('/downloads/:downloadId/resume', authenticate, storeController.resumeDownloadHandler);
router.post('/downloads/:downloadId/cancel', authenticate, storeController.cancelDownloadHandler);
router.post('/downloads/:downloadId/retry', authenticate, storeController.retryDownloadHandler);
router.get('/installed', authenticate, storeController.getInstalled);
router.get('/registry', authenticate, storeController.getRegistryHandler);
router.get('/registry/:bundleId', authenticate, storeController.getRegistryEntryHandler);
router.get('/downloads', authenticate, storeController.getDownloads);
router.get('/downloads/queue', authenticate, storeController.getQueueHandler);
router.get('/updates', authenticate, storeController.getUpdates);
router.get('/apps/:bundleId/changelog', authenticate, storeController.getChangelogHandler);
router.patch('/apps/:bundleId/auto-update', authenticate, storeController.setAutoUpdateHandler);
router.get('/apps/:bundleId/storage', authenticate, storeController.getAppStorageHandler);
router.post('/apps/:bundleId/clear-cache', authenticate, storeController.clearCacheHandler);
router.post('/apps/:bundleId/clear-data', authenticate, storeController.clearDataHandler);
router.get('/recently-installed', authenticate, storeController.getRecentlyInstalled);
router.get('/settings', authenticate, storeController.getStoreSettings);
router.patch('/settings', authenticate, storeController.updateStoreSettings);

// Admin seed
router.post('/seed', authenticate, requireAdmin, storeController.seedStore);

export default router;
