import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as realEstateController from '../controllers/realEstateController';

const router = Router();

router.post('/initialize', authenticate, realEstateController.initialize);
router.get('/types', authenticate, realEstateController.propertyTypes);
router.get('/dashboard', authenticate, realEstateController.dashboard);
router.get('/analytics', authenticate, realEstateController.analytics);
router.get('/audit', authenticate, realEstateController.auditLogs);

router.get('/properties', authenticate, realEstateController.properties);
router.post('/properties', authenticate, realEstateController.createProperty);
router.get('/properties/:id', authenticate, realEstateController.getProperty);
router.patch('/properties/:id', authenticate, realEstateController.updateProperty);
router.post('/properties/:id/approve', authenticate, realEstateController.approveProperty);
router.post('/properties/:id/feature', authenticate, realEstateController.featureProperty);
router.post('/properties/:id/archive', authenticate, realEstateController.archiveProperty);
router.post('/properties/:id/images', authenticate, realEstateController.uploadImage);
router.post('/properties/:id/floor-plans', authenticate, realEstateController.uploadFloorPlan);
router.post('/properties/:id/favorite', authenticate, realEstateController.toggleFavorite);

router.post('/search', authenticate, realEstateController.search);

router.get('/offers', authenticate, realEstateController.offers);
router.post('/offers', authenticate, realEstateController.createOffer);
router.post('/offers/:id/counter', authenticate, realEstateController.counterOffer);
router.post('/offers/:id/accept', authenticate, realEstateController.acceptOffer);

router.get('/sales', authenticate, realEstateController.sales);
router.get('/rentals', authenticate, realEstateController.rentals);
router.get('/leases', authenticate, realEstateController.leases);
router.post('/leases', authenticate, realEstateController.createLease);
router.post('/leases/:id/collect', authenticate, realEstateController.collectRent);

router.get('/maintenance', authenticate, realEstateController.maintenance);
router.post('/maintenance', authenticate, realEstateController.createMaintenance);
router.post('/inspections', authenticate, realEstateController.scheduleInspection);
router.post('/inspections/:id/complete', authenticate, realEstateController.completeInspection);

router.get('/favorites', authenticate, realEstateController.favorites);

router.get('/rbac', authenticate, realEstateController.rbac);
router.patch('/rbac', authenticate, realEstateController.updateRbac);

export default router;
