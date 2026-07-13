import { Router } from 'express';
import * as worldController from '../controllers/worldController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/state', authenticate, worldController.getWorldHandler);
router.post('/tick', authenticate, worldController.tickWorldHandler);
router.post('/initialize', authenticate, worldController.initializeWorldHandler);

router.get('/locations/search', authenticate, worldController.searchLocationsHandler);
router.get('/locations/:id', authenticate, worldController.getLocationDetailHandler);

router.get('/towers/nearby', authenticate, worldController.getNearbyTowersHandler);
router.get('/towers/:uuid', authenticate, worldController.getTowerHandler);

router.get('/gps', authenticate, worldController.getGpsHandler);
router.post('/gps/position', authenticate, worldController.setPositionHandler);
router.post('/gps/navigate', authenticate, worldController.startNavigationHandler);
router.post('/gps/stop', authenticate, worldController.stopNavigationHandler);
router.post('/gps/save', authenticate, worldController.savePlaceHandler);
router.post('/gps/favorite', authenticate, worldController.addFavoriteHandler);
router.get('/gps/search', authenticate, worldController.searchGpsHandler);
router.get('/gps/history', authenticate, worldController.getGpsHistoryHandler);

router.get('/carrier', authenticate, worldController.getCarrierHandler);
router.get('/network', authenticate, worldController.getWorldNetworkHandler);

router.get('/vpn', authenticate, worldController.getVpnHandler);
router.get('/vpn/countries', authenticate, worldController.getVpnCountriesHandler);
router.post('/vpn/connect', authenticate, worldController.connectVpnHandler);
router.post('/vpn/disconnect', authenticate, worldController.disconnectVpnHandler);
router.get('/vpn/history', authenticate, worldController.getVpnHistoryHandler);

router.post('/police/track', authenticate, worldController.policeTrackHandler);
router.get('/police/history', authenticate, worldController.policeTrackingHistoryHandler);

export default router;
