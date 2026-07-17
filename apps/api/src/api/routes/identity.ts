import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as identityController from '../controllers/identityController';

const router = Router();

router.post('/initialize', authenticate, identityController.initialize);
router.get('/profile', authenticate, identityController.profile);
router.patch('/profile', authenticate, identityController.updateProfile);
router.get('/documents', authenticate, identityController.documents);
router.post('/documents', authenticate, identityController.addDocument);
router.get('/emergency', authenticate, identityController.emergencyInfo);
router.patch('/emergency', authenticate, identityController.updateEmergencyInfo);
router.post('/qr/generate', authenticate, identityController.generateQr);
router.post('/qr/verify', authenticate, identityController.verifyQr);
router.post('/barcode/verify', authenticate, identityController.verifyBarcode);
router.get('/export/vcard', authenticate, identityController.exportVCard);
router.get('/search', authenticate, identityController.search);

export default router;
