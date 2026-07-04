import { Router } from 'express';
import * as contactsController from '../controllers/contactsController';
import * as contactsAdminController from '../controllers/contactsAdminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin routes
router.get('/admin/stats', authenticate, requireAdmin, contactsAdminController.adminStats);
router.get('/admin/audit', authenticate, requireAdmin, contactsAdminController.adminAuditLogs);
router.post('/admin/permissions/grant', authenticate, requireAdmin, contactsAdminController.adminGrantPermissions);
router.post('/admin/permissions/init', authenticate, requireAdmin, contactsAdminController.adminInitSelf);

// Permissions
router.post('/permissions/init', authenticate, contactsController.initPermissions);
router.get('/permissions', authenticate, contactsController.getPermissions);

// Dashboard & lists (before :id)
router.get('/dashboard', authenticate, contactsController.getDashboardData);
router.get('/search', authenticate, contactsController.search);
router.get('/favorites', authenticate, contactsController.getFavorites);
router.get('/recent', authenticate, contactsController.getRecent);
router.get('/emergency', authenticate, contactsController.getEmergency);
router.get('/export/all', authenticate, contactsController.exportHandler);
router.get('/audit/logs', authenticate, contactsController.getAuditLogs);

// Groups
router.get('/groups/list', authenticate, contactsController.getGroups);
router.post('/groups', authenticate, contactsController.createGroupHandler);
router.put('/groups/:id', authenticate, contactsController.updateGroupHandler);
router.delete('/groups/:id', authenticate, contactsController.deleteGroupHandler);
router.post('/groups/:id/add', authenticate, contactsController.addToGroup);

// Organizations
router.get('/organizations/list', authenticate, contactsController.getOrganizations);
router.post('/organizations', authenticate, contactsController.createOrganizationHandler);

// Import / sync / lookup
router.post('/import', authenticate, contactsController.importHandler);
router.post('/sync/identity', authenticate, contactsController.syncIdentity);
router.get('/lookup/phone/:phone', authenticate, contactsController.lookupPhone);

// CRUD
router.get('/', authenticate, contactsController.list);
router.post('/', authenticate, contactsController.create);
router.get('/:id', authenticate, contactsController.getById);
router.put('/:id', authenticate, contactsController.update);
router.delete('/:id', authenticate, contactsController.remove);

// Contact actions
router.post('/:id/favorite', authenticate, contactsController.toggleFavoriteHandler);
router.post('/:id/block', authenticate, contactsController.block);
router.post('/:id/unblock', authenticate, contactsController.unblock);
router.post('/:id/touch', authenticate, contactsController.touch);

export default router;
