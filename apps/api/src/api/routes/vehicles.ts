import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as vehicleController from '../controllers/vehicleController';

const router = Router();

router.post('/initialize', authenticate, vehicleController.initialize);
router.get('/categories', authenticate, vehicleController.categories);
router.get('/dashboard', authenticate, vehicleController.dashboard);
router.get('/analytics', authenticate, vehicleController.analytics);
router.get('/audit', authenticate, vehicleController.auditLogs);

router.get('/vehicles', authenticate, vehicleController.vehicles);
router.post('/vehicles', authenticate, vehicleController.createVehicle);
router.get('/vehicles/:id', authenticate, vehicleController.getVehicle);
router.patch('/vehicles/:id', authenticate, vehicleController.updateVehicle);
router.post('/vehicles/:id/list', authenticate, vehicleController.listVehicle);
router.post('/vehicles/:id/reserve', authenticate, vehicleController.reserveVehicle);
router.post('/vehicles/:id/favorite', authenticate, vehicleController.toggleFavorite);

router.post('/search', authenticate, vehicleController.search);

router.get('/dealers', authenticate, vehicleController.dealers);
router.post('/dealers', authenticate, vehicleController.createDealer);
router.get('/dealers/:id/inventory', authenticate, vehicleController.dealerInventory);

router.get('/offers', authenticate, vehicleController.offers);
router.post('/offers', authenticate, vehicleController.createOffer);
router.post('/offers/:id/accept', authenticate, vehicleController.acceptOffer);
router.post('/offers/:id/counter', authenticate, vehicleController.counterOffer);

router.get('/sales', authenticate, vehicleController.sales);

router.get('/finance', authenticate, vehicleController.finance);
router.post('/finance', authenticate, vehicleController.createFinance);

router.get('/auctions', authenticate, vehicleController.auctions);
router.post('/auctions', authenticate, vehicleController.createAuction);
router.post('/auctions/:id/bid', authenticate, vehicleController.placeBid);

router.post('/maintenance', authenticate, vehicleController.maintenance);

router.get('/favorites', authenticate, vehicleController.favorites);

router.get('/rbac', authenticate, vehicleController.rbac);
router.patch('/rbac', authenticate, vehicleController.updateRbac);

export default router;
