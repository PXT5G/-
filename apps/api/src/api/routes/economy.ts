import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as economyController from '../controllers/economyController';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/initialize', economyController.initialize);
router.post('/tick', economyController.triggerTick);
router.get('/dashboard', economyController.dashboard);
router.get('/state', economyController.state);
router.get('/reports', economyController.reports);
router.get('/gdp', economyController.gdpHistory);
router.get('/inflation', economyController.inflationHistory);
router.get('/valuations', economyController.valuations);
router.get('/valuations/:companyId', economyController.companyValuation);
router.get('/demand', economyController.demand);
router.get('/supply', economyController.supply);
router.get('/assets', economyController.assetValuations);
router.get('/analytics', economyController.analytics);
router.get('/bank', economyController.bankMetrics);
router.get('/events', economyController.events);
router.post('/events', economyController.createEvent);
router.get('/audit', economyController.auditLogs);
router.get('/rbac', economyController.rbac);

export default router;
