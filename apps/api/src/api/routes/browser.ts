import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as browserController from '../controllers/browserController';

const router = Router();

router.post('/initialize', authenticate, browserController.initialize);
router.get('/home', authenticate, browserController.home);
router.get('/sites', authenticate, browserController.sites);
router.post('/navigate', authenticate, browserController.navigate);
router.get('/search', authenticate, browserController.search);
router.get('/search/suggestions', authenticate, browserController.searchSuggestions);
router.get('/search/history', authenticate, browserController.searchHistory);

router.get('/sessions', authenticate, browserController.sessions);
router.post('/sessions', authenticate, browserController.createSession);

router.get('/tabs/closed', authenticate, browserController.closedTabs);
router.get('/tabs', authenticate, browserController.tabs);
router.post('/tabs', authenticate, browserController.createTab);
router.patch('/tabs/:tabId', authenticate, browserController.updateTab);
router.delete('/tabs/:tabId', authenticate, browserController.closeTab);

router.get('/tab-groups', authenticate, browserController.tabGroups);
router.post('/tab-groups', authenticate, browserController.createTabGroup);

router.get('/bookmarks', authenticate, browserController.bookmarks);
router.post('/bookmarks', authenticate, browserController.addBookmark);
router.delete('/bookmarks/:bookmarkId', authenticate, browserController.removeBookmark);

router.get('/history', authenticate, browserController.history);
router.delete('/history', authenticate, browserController.clearHistory);

router.get('/downloads', authenticate, browserController.downloads);
router.post('/downloads', authenticate, browserController.startDownload);
router.post('/downloads/:downloadId/control', authenticate, browserController.controlDownload);

router.get('/reading-list', authenticate, browserController.readingList);
router.post('/reading-list', authenticate, browserController.addReadingList);

router.get('/offline', authenticate, browserController.offlinePages);
router.post('/offline', authenticate, browserController.saveOfflinePage);
router.get('/offline/:pageId', authenticate, browserController.getOfflinePage);

router.get('/passwords', authenticate, browserController.passwords);
router.post('/passwords', authenticate, browserController.savePassword);
router.get('/passwords/:passwordId', authenticate, browserController.getPassword);

router.get('/forms', authenticate, browserController.savedForms);
router.post('/forms', authenticate, browserController.saveForm);

router.get('/cards', authenticate, browserController.savedCards);
router.post('/cards', authenticate, browserController.saveCard);

router.get('/permissions', authenticate, browserController.sitePermissions);
router.post('/permissions', authenticate, browserController.setSitePermission);

router.post('/translate', authenticate, browserController.translate);
router.post('/find', authenticate, browserController.findInPage);
router.post('/qr/generate', authenticate, browserController.generateQr);
router.post('/qr/scan', authenticate, browserController.scanQr);
router.post('/share', authenticate, browserController.share);

router.patch('/profile', authenticate, browserController.updateProfile);
router.get('/rbac', authenticate, browserController.rbac);
router.patch('/rbac', authenticate, browserController.updateRbac);

export default router;
