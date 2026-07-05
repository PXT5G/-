import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aviationController from '../controllers/aviationController';

const router = Router();

router.post('/initialize', authenticate, aviationController.initialize);
router.get('/categories', authenticate, aviationController.categories);
router.get('/dashboard', authenticate, aviationController.dashboard);
router.get('/analytics', authenticate, aviationController.analytics);
router.get('/audit', authenticate, aviationController.auditLogs);

router.get('/aircraft', authenticate, aviationController.aircraft);
router.post('/aircraft', authenticate, aviationController.createAircraft);
router.get('/aircraft/:id', authenticate, aviationController.getAircraft);
router.patch('/aircraft/:id', authenticate, aviationController.updateAircraft);
router.post('/aircraft/:id/list', authenticate, aviationController.listAircraftForSale);
router.post('/aircraft/:id/reserve', authenticate, aviationController.reserveAircraft);
router.post('/aircraft/:id/move', authenticate, aviationController.moveAircraft);
router.post('/aircraft/:id/favorite', authenticate, aviationController.toggleFavorite);

router.post('/search', authenticate, aviationController.search);

router.get('/dealers', authenticate, aviationController.dealers);
router.post('/dealers', authenticate, aviationController.createDealer);
router.get('/dealers/:id/fleet', authenticate, aviationController.dealerFleet);

router.get('/airports', authenticate, aviationController.airports);
router.post('/airports', authenticate, aviationController.createAirport);
router.get('/airports/:id', authenticate, aviationController.getAirport);
router.post('/hangars', authenticate, aviationController.createHangar);
router.post('/runways', authenticate, aviationController.createRunway);

router.get('/offers', authenticate, aviationController.offers);
router.post('/offers', authenticate, aviationController.createOffer);
router.post('/offers/:id/accept', authenticate, aviationController.acceptOffer);
router.post('/offers/:id/counter', authenticate, aviationController.counterOffer);

router.get('/sales', authenticate, aviationController.sales);

router.get('/finance', authenticate, aviationController.finance);
router.post('/finance', authenticate, aviationController.createFinance);
router.get('/leases', authenticate, aviationController.leases);
router.post('/leases', authenticate, aviationController.createLease);

router.get('/auctions', authenticate, aviationController.auctions);
router.post('/auctions', authenticate, aviationController.createAuction);
router.post('/auctions/:id/bid', authenticate, aviationController.placeBid);

router.post('/maintenance', authenticate, aviationController.maintenance);

router.get('/favorites', authenticate, aviationController.favorites);

router.get('/rbac', authenticate, aviationController.rbac);
router.patch('/rbac', authenticate, aviationController.updateRbac);

export default router;
