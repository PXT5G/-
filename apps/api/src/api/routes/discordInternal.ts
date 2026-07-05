import { Router } from 'express';
import { authenticateService } from '../middleware/serviceAuth';
import * as discordController from '../controllers/discordController';

const router = Router();

router.use(authenticateService);

router.post('/link', discordController.postLink);
router.post('/unlink', discordController.postUnlink);
router.get('/notifications/pending', discordController.getPending);
router.post('/notifications/:outboxId/ack', discordController.postAck);

export default router;
