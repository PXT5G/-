import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as exchangeController from '../controllers/exchangeController';

const router = Router();

router.post('/initialize', authenticate, exchangeController.initialize);
router.get('/dashboard', authenticate, exchangeController.dashboard);
router.get('/analytics', authenticate, exchangeController.analytics);
router.get('/audit', authenticate, exchangeController.audit);
router.post('/tick', authenticate, exchangeController.tick);

router.get('/stocks', authenticate, exchangeController.stocks);
router.get('/stocks/:id', authenticate, exchangeController.getStock);
router.get('/search', authenticate, exchangeController.search);

router.get('/portfolio', authenticate, exchangeController.portfolio);
router.get('/orders', authenticate, exchangeController.orders);
router.post('/orders', authenticate, exchangeController.createOrder);
router.delete('/orders/:id', authenticate, exchangeController.cancelOrder);
router.get('/trades', authenticate, exchangeController.trades);

router.get('/indexes', authenticate, exchangeController.indexes);
router.get('/news', authenticate, exchangeController.news);

router.get('/watchlist', authenticate, exchangeController.watchlist);
router.put('/watchlist', authenticate, exchangeController.updateWatchlist);

router.get('/ipos', authenticate, exchangeController.ipos);
router.post('/ipos', authenticate, exchangeController.applyIpo);
router.post('/ipos/:id/review', authenticate, exchangeController.reviewIpo);

router.post('/dividends', authenticate, exchangeController.distributeDividend);

export default router;
