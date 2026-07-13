import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  EMS_ROLES,
  PERSONNEL_STATUSES,
  DISPATCH_STATUSES,
  TREATMENT_TYPES,
} from '../../constants/ems';
import * as emsService from '../../services/emsService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    NOT_EMS_PERSONNEL: [403, 'Not registered as EMS personnel'],
    APP_NOT_INSTALLED: [403, 'EMS app not installed'],
    DISPATCH_NOT_FOUND: [404, 'Dispatch not found'],
    UNIT_NOT_FOUND: [404, 'Unit not found'],
    PATIENT_NOT_FOUND: [404, 'Patient not found'],
    HOSPITAL_NOT_FOUND: [404, 'Hospital not found'],
    DEPARTMENT_NOT_FOUND: [404, 'Department not found'],
    ADMISSION_NOT_FOUND: [404, 'Admission not found'],
    NO_HOSPITAL_AVAILABLE: [404, 'No hospital available'],
    INVALID_SEARCH_TYPE: [400, 'Invalid search type'],
    USER_NOT_FOUND: [404, 'User not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function clientMeta(req: AuthRequest) {
  return {
    ipAddress: req.ip,
    deviceUuid: req.headers['x-device-uuid'] as string | undefined,
  };
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.initializeEms(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(PERSONNEL_STATUSES as unknown as [string, ...string[]]),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.updatePersonnelStatus(
      req.user!.userId, body.status as never, getActorId(req), req.user!.role,
      { ...body, ...clientMeta(req) }
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const units = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listUnits(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateUnitGps = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    latitude: z.number(),
    longitude: z.number(),
    heading: z.number().optional(),
    speed: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.updateUnitLocation(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dispatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listDispatches(req.user!.userId, req.user!.role, {
      is911: req.query.is911 === 'true',
      status: req.query.status as string | undefined,
    });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDispatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    callType: z.string(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    title: z.string().min(1),
    description: z.string().min(1),
    callerPhone: z.string().optional(),
    patientName: z.string().optional(),
    patientUserId: z.string().optional(),
    address: z.string().optional(),
    district: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    is911: z.boolean().optional(),
    isMassCasualty: z.boolean().optional(),
    patientCount: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createDispatch(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateDispatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(DISPATCH_STATUSES as unknown as [string, ...string[]]).optional(),
    assignedUnitId: z.string().optional(),
    assignedBadgeNumbers: z.array(z.string()).optional(),
    destinationHospitalId: z.string().optional(),
    notes: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.updateDispatch(getActorId(req), String(req.params.id), body as never, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const assignAmbulance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ unitId: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await emsService.assignAmbulance(getActorId(req), String(req.params.id), body.unitId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const routeHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ hospitalId: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await emsService.routeToHospital(getActorId(req), String(req.params.id), body.hospitalId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const helicopterDispatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.dispatchHelicopter(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const patients = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listPatients(req.user!.userId, req.user!.role, req.query.status as string);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getPatientById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.getPatient(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPatient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().min(1),
    userId: z.string().optional(),
    bloodType: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyId: z.string().optional(),
    dispatchId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createPatient(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const records = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listMedicalRecords(req.user!.userId, req.user!.role, req.query.patientId as string);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    patientId: z.string().min(1),
    dispatchId: z.string().optional(),
    chiefComplaint: z.string().optional(),
    notes: z.string().optional(),
    vitals: z.record(z.number()).optional(),
    injuries: z.array(z.object({
      description: z.string(),
      severity: z.string(),
      bodyPart: z.string(),
    })).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createMedicalRecord(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createTreatment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    patientId: z.string().min(1),
    recordId: z.string().optional(),
    dispatchId: z.string().optional(),
    treatmentType: z.enum(TREATMENT_TYPES as unknown as [string, ...string[]]),
    description: z.string().min(1),
    medication: z.string().optional(),
    dosage: z.string().optional(),
    outcome: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createTreatment(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPrescription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    patientId: z.string().min(1),
    recordId: z.string().optional(),
    medication: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createPrescription(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const hospitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listHospitals(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getHospital = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.getHospitalDetail(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const admit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    patientId: z.string().min(1),
    hospitalId: z.string().min(1),
    departmentId: z.string().min(1),
    diagnosis: z.string().min(1),
    dispatchId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.admitPatient(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const discharge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ dischargeNotes: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await emsService.dischargePatient(getActorId(req), String(req.params.id), body.dischargeNotes, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const ambulances = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listAmbulances(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const incidents = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listIncidents(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createIncident = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['mass_casualty', 'multi_vehicle', 'disaster', 'active_shooter', 'hazmat', 'other']),
    location: z.string().min(1),
    district: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    patientCount: z.number().optional(),
    criticalCount: z.number().optional(),
    policeDispatchId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.createIncident(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const personnel = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listPersonnel(req.user!.userId, req.user!.role, req.query.role as string);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    searchType: z.string().min(1),
    query: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.performSearch(
      getActorId(req), body.searchType, body.query, req.user!.role, clientMeta(req)
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const alert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ title: z.string().min(1), body: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await emsService.broadcastAlert(getActorId(req), body.title, body.body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const medicalRecordsList = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listAllMedicalRecords(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const treatmentsList = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listTreatments(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const notes = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listEmsNotes(req.user!.userId, req.user!.role, req.query.subjectId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ content: z.string().min(1), subjectType: z.string().optional(), subjectId: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await emsService.createEmsNote(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.listAuditLog(req.user!.userId, req.user!.role, Number(req.query.limit) || 100);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await emsService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(EMS_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await emsService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
