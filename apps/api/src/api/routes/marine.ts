import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as marineController from '../controllers/marineController';

const router = Router();

router.post('/initialize', authenticate, marineController.initialize);
router.get('/categories', authenticate, marineController.categories);
router.get('/dashboard', authenticate, marineController.dashboard);
router.get('/analytics', authenticate, marineController.analytics);
router.get('/audit', authenticate, marineController.auditLogs);

router.get('/vessels', authenticate, marineController.vessels);
router.post('/vessels', authenticate, marineController.createVessel);
router.get('/vessels/:id', authenticate, marineController.getVessel);
router.patch('/vessels/:id', authenticate, marineController.updateVessel);
router.post('/vessels/:id/list', authenticate, marineController.listVesselForSale);
router.post('/vessels/:id/reserve', authenticate, marineController.reserveVessel);
router.post('/vessels/:id/move', authenticate, marineController.moveVessel);
router.post('/vessels/:id/favorite', authenticate, marineController.toggleFavorite);

router.post('/search', authenticate, marineController.search);

router.get('/dealers', authenticate, marineController.dealers);
router.post('/dealers', authenticate, marineController.createDealer);
router.get('/dealers/:id/fleet', authenticate, marineController.dealerFleet);

router.get('/marinas', authenticate, marineController.marinas);
router.post('/marinas', authenticate, marineController.createMarina);
router.get('/marinas/:id', authenticate, marineController.getMarina);
router.post('/docks', authenticate, marineController.createDock);
router.post('/ports', authenticate, marineController.createPort);

router.get('/offers', authenticate, marineController.offers);
router.post('/offers', authenticate, marineController.createOffer);
router.post('/offers/:id/accept', authenticate, marineController.acceptOffer);
router.post('/offers/:id/counter', authenticate, marineController.counterOffer);

router.get('/sales', authenticate, marineController.sales);

router.get('/finance', authenticate, marineController.finance);
router.post('/finance', authenticate, marineController.createFinance);
router.get('/leases', authenticate, marineController.leases);
router.post('/leases', authenticate, marineController.createLease);

router.get('/auctions', authenticate, marineController.auctions);
router.post('/auctions', authenticate, marineController.createAuction);
router.post('/auctions/:id/bid', authenticate, marineController.placeBid);

router.post('/maintenance', authenticate, marineController.maintenance);

router.get('/favorites', authenticate, marineController.favorites);

router.get('/rbac', authenticate, marineController.rbac);
router.patch('/rbac', authenticate, marineController.updateRbac);

export default router;
