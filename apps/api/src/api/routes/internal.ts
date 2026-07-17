import { Router } from 'express';
import { authenticateService } from '../middleware/serviceAuth';
import { attachCharacterContext } from '../middleware/characterContext';
import * as internalController from '../controllers/internalController';
import * as characterController from '../controllers/characterInternalController';

const router = Router();

router.get('/health', internalController.getHealth);
router.post('/heartbeat', authenticateService, internalController.postHeartbeat);
router.get('/services', authenticateService, internalController.getServices);

const characterRouter = Router();
characterRouter.use(authenticateService);
characterRouter.use(attachCharacterContext);

characterRouter.post('/account/link', characterController.postLinkAccount);
characterRouter.post('/register', characterController.postRegisterCharacter);
characterRouter.post('/phone/bind', characterController.postBindPhone);
characterRouter.post('/session/open', characterController.postOpenSession);
characterRouter.post('/changed', characterController.postCharacterChanged);
characterRouter.post('/inventory/attest', characterController.postInventoryAttestation);
characterRouter.post('/phone/verify', characterController.postVerifyPhone);
characterRouter.post('/phone/revoke', characterController.postRevokePhone);
characterRouter.get('/session/active', characterController.getActiveSession);
characterRouter.get('/phone', characterController.getCharacterPhone);

router.use('/character', characterRouter);

export default router;
