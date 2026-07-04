import { Router } from 'express';
import * as policeController from '../controllers/policeController';
import * as policeAdminController from '../controllers/policeAdminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin
router.get('/admin/stats', authenticate, requireAdmin, policeAdminController.adminStats);
router.get('/admin/audit', authenticate, requireAdmin, policeAdminController.adminAuditLogs);
router.post('/admin/permissions/grant', authenticate, requireAdmin, policeAdminController.adminGrantPermissions);
router.post('/admin/permissions/init', authenticate, requireAdmin, policeAdminController.adminInitSelf);

// Officer profile & permissions
router.get('/permissions', authenticate, policeController.getPermissions);
router.get('/me', authenticate, policeController.getMe);
router.post('/provision', authenticate, policeController.provision);

// Dashboard & audit (before :id)
router.get('/dashboard', authenticate, policeController.getDashboardData);
router.get('/audit/logs', authenticate, policeController.auditLogs);

// MDT
router.get('/mdt/persons', authenticate, policeController.mdtPersons);
router.get('/mdt/vehicles', authenticate, policeController.mdtVehicles);
router.get('/mdt/properties', authenticate, policeController.mdtProperties);
router.get('/mdt/cases', authenticate, policeController.mdtCases);

// Reports
router.get('/reports', authenticate, policeController.listReportsHandler);
router.post('/reports', authenticate, policeController.createReportHandler);
router.post('/reports/:id/review', authenticate, policeController.reviewReportHandler);

// Rankings
router.get('/officers', authenticate, policeController.listOfficersHandler);
router.post('/officers/:id/points', authenticate, policeController.addPointsHandler);
router.post('/officers/:id/promote', authenticate, policeController.promoteHandler);
router.get('/officers/:id/rank-history', authenticate, policeController.rankHistory);
router.post('/officers/:id/status', authenticate, policeController.updateStatus);

// Dispatch
router.get('/dispatch', authenticate, policeController.listDispatchesHandler);
router.post('/dispatch', authenticate, policeController.createDispatchHandler);
router.post('/dispatch/:id/assign', authenticate, policeController.assignDispatchHandler);
router.patch('/dispatch/:id/status', authenticate, policeController.updateDispatchHandler);

// Cases
router.get('/cases', authenticate, policeController.listCasesHandler);
router.post('/cases', authenticate, policeController.createCaseHandler);
router.post('/cases/:id/assign', authenticate, policeController.assignCaseHandler);
router.get('/cases/:id/evidence', authenticate, policeController.caseEvidence);
router.post('/evidence', authenticate, policeController.addEvidenceHandler);

// Vehicles
router.get('/vehicles/search', authenticate, policeController.searchVehiclesHandler);
router.post('/vehicles', authenticate, policeController.registerVehicleHandler);

// Chat
router.get('/chat', authenticate, policeController.getChat);
router.post('/chat', authenticate, policeController.sendChat);

export default router;
