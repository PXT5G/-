import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as justiceController from '../controllers/justiceController';

const router = Router();

router.post('/initialize', authenticate, justiceController.initialize);
router.get('/dashboard', authenticate, justiceController.dashboard);
router.patch('/status', authenticate, justiceController.updateStatus);

router.get('/cases', authenticate, justiceController.cases);
router.get('/cases/:id', authenticate, justiceController.getCaseById);
router.post('/cases', authenticate, justiceController.createCase);
router.patch('/cases/:id', authenticate, justiceController.updateCase);

router.get('/hearings', authenticate, justiceController.hearings);
router.post('/hearings', authenticate, justiceController.scheduleHearing);
router.patch('/hearings/:id', authenticate, justiceController.updateHearing);

router.get('/trials', authenticate, justiceController.trials);
router.post('/trials', authenticate, justiceController.createTrial);
router.patch('/trials/:id', authenticate, justiceController.updateTrial);

router.get('/officials', authenticate, justiceController.officials);
router.get('/courtrooms', authenticate, justiceController.courtrooms);
router.post('/courtrooms/:id/live', authenticate, justiceController.courtroomLive);

router.get('/evidence', authenticate, justiceController.evidence);
router.post('/evidence', authenticate, justiceController.createEvidence);
router.patch('/evidence/:id/custody', authenticate, justiceController.transferEvidence);

router.get('/witnesses', authenticate, justiceController.witnesses);
router.post('/witnesses', authenticate, justiceController.addWitness);

router.get('/charges', authenticate, justiceController.charges);
router.post('/charges', authenticate, justiceController.fileCharge);

router.get('/laws', authenticate, justiceController.laws);

router.get('/sentences', authenticate, justiceController.sentences);
router.post('/sentences', authenticate, justiceController.issueSentence);

router.get('/warrants', authenticate, justiceController.warrants);
router.patch('/warrants/:id/review', authenticate, justiceController.reviewWarrant);

router.get('/appeals', authenticate, justiceController.appeals);
router.post('/appeals', authenticate, justiceController.fileAppeal);
router.patch('/appeals/:id', authenticate, justiceController.updateAppeal);

router.post('/subpoenas', authenticate, justiceController.issueSubpoena);
router.post('/judgments', authenticate, justiceController.issueJudgment);

router.get('/citations/contested', authenticate, justiceController.contestedCitations);
router.patch('/citations/:id/resolve', authenticate, justiceController.resolveCitation);

router.get('/docket', authenticate, justiceController.docket);
router.post('/docket', authenticate, justiceController.publishDocket);

router.get('/notes', authenticate, justiceController.legalNotes);
router.post('/notes', authenticate, justiceController.createLegalNote);
router.get('/documents', authenticate, justiceController.documents);
router.post('/documents', authenticate, justiceController.createDocument);
router.get('/audit-log', authenticate, justiceController.auditLog);

router.post('/search', authenticate, justiceController.search);
router.get('/analytics', authenticate, justiceController.analytics);

router.get('/rbac', authenticate, justiceController.rbac);
router.patch('/rbac', authenticate, justiceController.updateRbac);

export default router;
