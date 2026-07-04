import { Router } from 'express';
import * as fileSystemController from '../controllers/fileSystemController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, fileSystemController.listFiles);
router.post('/folder', authenticate, fileSystemController.createFolder);
router.post('/file', authenticate, fileSystemController.createFile);
router.delete('/:id', authenticate, fileSystemController.deleteFile);

export default router;
