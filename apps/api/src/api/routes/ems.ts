import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as emsController from '../controllers/emsController';

const router = Router();

router.post('/initialize', authenticate, emsController.initialize);
router.get('/dashboard', authenticate, emsController.dashboard);
router.patch('/status', authenticate, emsController.updateStatus);

router.get('/units', authenticate, emsController.units);
router.patch('/units/:id/gps', authenticate, emsController.updateUnitGps);

router.get('/dispatches', authenticate, emsController.dispatches);
router.post('/dispatches', authenticate, emsController.createDispatch);
router.patch('/dispatches/:id', authenticate, emsController.updateDispatch);
router.post('/dispatches/:id/assign', authenticate, emsController.assignAmbulance);
router.post('/dispatches/:id/route', authenticate, emsController.routeHospital);
router.post('/dispatches/:id/helicopter', authenticate, emsController.helicopterDispatch);

router.get('/patients', authenticate, emsController.patients);
router.get('/patients/:id', authenticate, emsController.getPatientById);
router.post('/patients', authenticate, emsController.createPatient);

router.get('/records', authenticate, emsController.records);
router.post('/records', authenticate, emsController.createRecord);
router.post('/treatments', authenticate, emsController.createTreatment);
router.post('/prescriptions', authenticate, emsController.createPrescription);

router.get('/hospitals', authenticate, emsController.hospitals);
router.get('/hospitals/:id', authenticate, emsController.getHospital);
router.post('/admissions', authenticate, emsController.admit);
router.patch('/admissions/:id/discharge', authenticate, emsController.discharge);

router.get('/ambulances', authenticate, emsController.ambulances);
router.get('/incidents', authenticate, emsController.incidents);
router.post('/incidents', authenticate, emsController.createIncident);

router.get('/personnel', authenticate, emsController.personnel);
router.get('/records/all', authenticate, emsController.medicalRecordsList);
router.get('/treatments', authenticate, emsController.treatmentsList);
router.get('/notes', authenticate, emsController.notes);
router.post('/notes', authenticate, emsController.createNote);
router.get('/audit-log', authenticate, emsController.auditLog);
router.post('/search', authenticate, emsController.search);
router.get('/analytics', authenticate, emsController.analytics);
router.post('/alert', authenticate, emsController.alert);

router.get('/rbac', authenticate, emsController.rbac);
router.patch('/rbac', authenticate, emsController.updateRbac);

export default router;
