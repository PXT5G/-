import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as intelligenceController from '../controllers/intelligenceController';

const router = Router();
router.post('/initialize', authenticate, intelligenceController.initialize);
router.get('/predictions', authenticate, intelligenceController.predictions);
router.get('/suggestions', authenticate, intelligenceController.suggestions);
router.post('/suggestions/:id/dismiss', authenticate, intelligenceController.dismissSuggestion);
router.get('/search', authenticate, intelligenceController.search);
router.post('/search/refresh', authenticate, intelligenceController.refreshIndex);
router.get('/search/history', authenticate, intelligenceController.searchHistory);
router.get('/dashboards', authenticate, intelligenceController.dashboards);
router.post('/dashboards/:id/refresh', authenticate, intelligenceController.refreshDashboard);
router.post('/voice/start', authenticate, intelligenceController.startVoice);
router.post('/voice/command', authenticate, intelligenceController.voiceCommand);
router.post('/voice/end', authenticate, intelligenceController.endVoice);
router.post('/optimize', authenticate, intelligenceController.optimize);
export default router;
