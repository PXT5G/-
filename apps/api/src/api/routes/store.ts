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

// Authenticated actions
router.post('/apps/:bundleId/reviews', authenticate, storeController.postReview);
router.post('/apps/:bundleId/install', authenticate, storeController.installApp);
router.post('/downloads/:downloadId/complete', authenticate, storeController.completeInstall);
router.delete('/apps/:bundleId/uninstall', authenticate, storeController.uninstallApp);
router.post('/apps/:bundleId/update', authenticate, storeController.updateApp);
router.post('/downloads/:downloadId/complete-update', authenticate, storeController.completeUpdate);
router.get('/installed', authenticate, storeController.getInstalled);
router.get('/downloads', authenticate, storeController.getDownloads);
router.get('/updates', authenticate, storeController.getUpdates);
router.get('/recently-installed', authenticate, storeController.getRecentlyInstalled);
router.get('/settings', authenticate, storeController.getStoreSettings);
router.patch('/settings', authenticate, storeController.updateStoreSettings);

// Admin seed
router.post('/seed', authenticate, requireAdmin, storeController.seedStore);

export default router;
