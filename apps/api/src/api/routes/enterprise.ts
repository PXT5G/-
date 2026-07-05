import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as phase55Controller from '../controllers/phase55Controller';

const router = Router();
router.get('/orgs', authenticate, phase55Controller.listEnterpriseOrgs);
router.post('/orgs', authenticate, phase55Controller.createEnterpriseOrg);
export default router;
