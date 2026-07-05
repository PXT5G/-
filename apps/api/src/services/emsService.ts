import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { EmsPersonnel } from '../database/models/EmsPersonnel';
import { EmsUnit } from '../database/models/EmsUnit';
import { EmsAmbulance } from '../database/models/EmsAmbulance';
import { EmsDispatch } from '../database/models/EmsDispatch';
import { EmsPatient } from '../database/models/EmsPatient';
import { EmsMedicalRecord } from '../database/models/EmsMedicalRecord';
import { EmsTreatment } from '../database/models/EmsTreatment';
import { EmsPrescription } from '../database/models/EmsPrescription';
import { EmsHospital } from '../database/models/EmsHospital';
import { EmsDepartment } from '../database/models/EmsDepartment';
import { EmsBed } from '../database/models/EmsBed';
import { EmsAdmission } from '../database/models/EmsAdmission';
import { EmsIncident } from '../database/models/EmsIncident';
import { EmsSearchLog } from '../database/models/EmsSearchLog';
import {
  EMS_APP_BUNDLE,
  EMS_ROLES,
  type EmsRole,
  type PersonnelStatus,
  type EmsDispatchStatus,
  type UnitStatus,
} from '../constants/ems';
import {
  seedEmsRoleConfigs,
  requirePersonnel,
  assertEmsPermission,
  formatPersonnel,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './emsRBACService';
import {
  logEmsAction,
  logMedicalAccess,
  searchCitizen,
  searchMedicalRecord,
  searchByBloodType,
  searchEmergencyContact,
  searchInsurance,
  searchAllergies,
  searchPreviousTreatments,
  getPatientFromUser,
  getMedical911Calls,
  calculateEtaMinutes,
  findNearestHospital,
  getHospitalCapacity,
  searchIdentity,
  searchPhone,
  getWorldLocation,
} from './emsIntegrationService';
import { emitToUser } from './socketService';
import { enqueueNotification } from './notificationBrokerService';
import { checkPermission } from './permissionBrokerService';
import { getWorldState } from './worldEngineService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function broadcastEms(event: string, data: unknown, userId?: string) {
  if (userId) emitToUser(userId, event as never, data);
  const personnel = await EmsPersonnel.find({ deletedAt: null, status: { $ne: 'off_duty' } });
  for (const p of personnel) {
    emitToUser(p.userId.toString(), event as never, data);
  }
}

async function formatPersonnelWithUser(personnel: InstanceType<typeof EmsPersonnel>) {
  const user = await User.findById(personnel.userId);
  return formatPersonnel(personnel, user ?? undefined);
}

const ROLE_TITLES: Record<EmsRole, string> = {
  chief_ems: 'Chief of EMS',
  deputy: 'Deputy Chief',
  doctor: 'Doctor',
  surgeon: 'Surgeon',
  paramedic: 'Paramedic',
  nurse: 'Nurse',
  dispatcher: 'Dispatcher',
  trainee: 'Trainee',
  administrator: 'Administrator',
};

export async function initializeEms(userId: string, userRole?: string) {
  await seedEmsRoleConfigs();

  const hasApp = await checkPermission(userId, EMS_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  let personnel = await EmsPersonnel.findOne({ userId, deletedAt: null });
  if (!personnel) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const badgeNumber = `EM-${String(await EmsPersonnel.countDocuments() + 1).padStart(4, '0')}`;
    const defaultRole: EmsRole = userRole === 'admin' ? 'chief_ems' : 'paramedic';
    personnel = await EmsPersonnel.create({
      userId: new Types.ObjectId(userId),
      badgeNumber,
      role: defaultRole,
      title: ROLE_TITLES[defaultRole],
      status: 'off_duty',
      signatureHash: crypto.createHash('sha256').update(`${badgeNumber}:${userId}`).digest('hex'),
      createdBy: new Types.ObjectId(userId),
    });
  }

  await seedDefaultUnits();
  await seedHospitals();
  await seedAmbulances();

  emitToUser(userId, 'ems:initialized', { personnel: await formatPersonnelWithUser(personnel) });
  return { initialized: true, personnel: await formatPersonnelWithUser(personnel) };
}

async function seedDefaultUnits() {
  if (await EmsUnit.countDocuments() > 0) return;
  const units = [
    { unitId: 'EMS-ALPHA', code: 'A-1', name: 'Alpha Ambulance', type: 'ambulance' as const, radioChannel: 'MED-1' },
    { unitId: 'EMS-BRAVO', code: 'B-1', name: 'Bravo Ambulance', type: 'ambulance' as const, radioChannel: 'MED-2' },
    { unitId: 'EMS-CHARLIE', code: 'C-1', name: 'Charlie Rapid Response', type: 'rapid_response' as const, radioChannel: 'MED-3' },
    { unitId: 'EMS-DISPATCH', code: 'DISP-1', name: 'EMS Dispatch', type: 'supervisor' as const, radioChannel: 'MED-0' },
    { unitId: 'EMS-AIR', code: 'AIR-1', name: 'Air Med Helicopter', type: 'helicopter' as const, radioChannel: 'MED-AIR' },
  ];
  for (const u of units) {
    await EmsUnit.create({ ...u, status: 'available', memberBadges: [] });
  }
}

async function seedAmbulances() {
  if (await EmsAmbulance.countDocuments() > 0) return;
  const ambulances = [
    { ambulanceId: id('AMB'), plateNumber: 'EMS-1001', callSign: 'Medic 1', type: 'type_1' as const, unitId: 'EMS-ALPHA' },
    { ambulanceId: id('AMB'), plateNumber: 'EMS-1002', callSign: 'Medic 2', type: 'type_1' as const, unitId: 'EMS-BRAVO' },
    { ambulanceId: id('AMB'), plateNumber: 'EMS-1003', callSign: 'Rapid 1', type: 'fly_car' as const, unitId: 'EMS-CHARLIE' },
    { ambulanceId: id('AMB'), plateNumber: 'EMS-AIR1', callSign: 'Air Med 1', type: 'helicopter' as const, unitId: 'EMS-AIR' },
  ];
  for (const a of ambulances) {
    await EmsAmbulance.create({
      ...a,
      status: 'available',
      equipment: ['defibrillator', 'oxygen', 'stretcher', 'first_aid_kit'],
    });
  }
}

async function seedHospitals() {
  if (await EmsHospital.countDocuments() > 0) return;

  const hospitals = [
    {
      hospitalId: 'HOSP-GULF-GENERAL',
      name: 'GULF General Hospital',
      address: '100 Medical Center Dr',
      district: 'Downtown',
      latitude: 34.0522,
      longitude: -118.2437,
      phone: '555-0100',
      traumaLevel: 1,
      totalBeds: 250,
      availableBeds: 180,
      erCapacity: 40,
      erOccupied: 12,
      orCount: 8,
      orAvailable: 5,
    },
    {
      hospitalId: 'HOSP-GULF-TRAUMA',
      name: 'GULF Trauma Center',
      address: '500 Emergency Way',
      district: 'Vinewood',
      latitude: 34.1022,
      longitude: -118.2937,
      phone: '555-0911',
      traumaLevel: 1,
      totalBeds: 120,
      availableBeds: 45,
      erCapacity: 25,
      erOccupied: 18,
      orCount: 6,
      orAvailable: 2,
    },
    {
      hospitalId: 'HOSP-GULF-COMMUNITY',
      name: 'GULF Community Hospital',
      address: '220 Wellness Blvd',
      district: 'Sandy Shores',
      latitude: 34.0022,
      longitude: -118.1437,
      phone: '555-0200',
      traumaLevel: 3,
      totalBeds: 80,
      availableBeds: 55,
      erCapacity: 15,
      erOccupied: 5,
      orCount: 3,
      orAvailable: 3,
    },
  ];

  for (const h of hospitals) {
    const hospital = await EmsHospital.create({ ...h, status: 'open', departments: [] });

    const deptTypes = [
      { type: 'er' as const, name: 'Emergency Room', beds: 20 },
      { type: 'icu' as const, name: 'Intensive Care', beds: 15 },
      { type: 'surgery' as const, name: 'Surgery', beds: 10 },
      { type: 'pharmacy' as const, name: 'Pharmacy', beds: 0 },
    ];

    for (const d of deptTypes) {
      const dept = await EmsDepartment.create({
        departmentId: id('DEPT'),
        hospitalId: hospital.hospitalId,
        name: d.name,
        type: d.type,
        bedCount: d.beds,
        occupiedBeds: Math.floor(d.beds * 0.3),
        waitingQueue: Math.floor(Math.random() * 5),
      });

      for (let i = 1; i <= d.beds; i++) {
        await EmsBed.create({
          bedId: id('BED'),
          hospitalId: hospital.hospitalId,
          departmentId: dept.departmentId,
          roomNumber: `${d.type.toUpperCase()}-${Math.ceil(i / 2)}`,
          bedNumber: String(i),
          status: i <= dept.occupiedBeds ? 'occupied' : 'available',
        });
      }
    }
  }
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'dashboard.view', userRole);
  const personnel = await requirePersonnel(userId);
  const world = await getWorldState(userId).catch(() => null);

  const [activeDispatches, calls911, onDutyPersonnel, availableUnits, criticalPatients, activeIncidents] = await Promise.all([
    EmsDispatch.countDocuments({ status: { $in: ['pending', 'assigned', 'en_route', 'on_scene', 'transporting'] }, deletedAt: null }),
    EmsDispatch.countDocuments({ is911: true, status: { $ne: 'resolved' }, deletedAt: null }),
    EmsPersonnel.countDocuments({ status: { $in: ['on_duty', 'en_route', 'on_scene', 'at_hospital'] }, deletedAt: null }),
    EmsUnit.countDocuments({ status: 'available', deletedAt: null }),
    EmsPatient.countDocuments({ status: { $in: ['critical', 'serious'] }, deletedAt: null }),
    EmsIncident.countDocuments({ status: 'active', deletedAt: null }),
  ]);

  const recentDispatches = await EmsDispatch.find({ deletedAt: null })
    .sort({ priority: 1, createdAt: -1 }).limit(5);

  const hospitalCapacity = await getHospitalCapacity();

  return {
    personnel: await formatPersonnelWithUser(personnel),
    stats: {
      activeDispatches,
      calls911,
      onDutyPersonnel,
      availableUnits,
      criticalPatients,
      activeIncidents,
    },
    location: world ? {
      district: world.district,
      street: world.street,
      latitude: world.latitude,
      longitude: world.longitude,
    } : null,
    recentDispatches: recentDispatches.map(formatDispatch),
    hospitalCapacity,
    permissions: await getRolePermissions(personnel.role),
  };
}

function formatDispatch(d: InstanceType<typeof EmsDispatch>) {
  return {
    dispatchId: d.dispatchId,
    callType: d.callType,
    priority: d.priority,
    status: d.status,
    title: d.title,
    description: d.description,
    callerPhone: d.callerPhone,
    patientName: d.patientName,
    address: d.address,
    district: d.district,
    latitude: d.latitude,
    longitude: d.longitude,
    is911: d.is911,
    isMassCasualty: d.isMassCasualty,
    isHelicopter: d.isHelicopter,
    assignedUnitId: d.assignedUnitId,
    assignedBadgeNumbers: d.assignedBadgeNumbers,
    destinationHospitalId: d.destinationHospitalId,
    etaMinutes: d.etaMinutes,
    patientCount: d.patientCount,
    createdAt: (d as unknown as { createdAt: Date }).createdAt?.toISOString(),
  };
}

function formatUnit(u: InstanceType<typeof EmsUnit>) {
  return {
    unitId: u.unitId,
    code: u.code,
    name: u.name,
    type: u.type,
    status: u.status,
    leaderBadge: u.leaderBadge,
    memberBadges: u.memberBadges,
    latitude: u.latitude,
    longitude: u.longitude,
    heading: u.heading,
    speed: u.speed,
    district: u.district,
    hospitalId: u.hospitalId,
    etaMinutes: u.etaMinutes,
    radioChannel: u.radioChannel,
    ambulanceId: u.ambulanceId,
  };
}

function formatPatient(p: InstanceType<typeof EmsPatient>) {
  return {
    patientId: p.patientId,
    userId: p.userId?.toString(),
    name: p.name,
    bloodType: p.bloodType,
    allergies: p.allergies,
    conditions: p.conditions,
    emergencyContactName: p.emergencyContactName,
    emergencyContactPhone: p.emergencyContactPhone,
    insuranceProvider: p.insuranceProvider,
    status: p.status,
    currentHospitalId: p.currentHospitalId,
    lastTreatmentAt: p.lastTreatmentAt?.toISOString(),
  };
}

export async function updatePersonnelStatus(
  userId: string,
  status: PersonnelStatus,
  actorId: string,
  userRole?: string,
  meta?: { latitude?: number; longitude?: number; district?: string; deviceUuid?: string; ipAddress?: string }
) {
  await assertEmsPermission(actorId, 'mdt.access', userRole);
  const personnel = await requirePersonnel(actorId);
  personnel.status = status;
  personnel.lastStatusAt = new Date();
  if (meta?.latitude !== undefined) personnel.latitude = meta.latitude;
  if (meta?.longitude !== undefined) personnel.longitude = meta.longitude;
  if (meta?.district) personnel.district = meta.district;
  if (meta?.deviceUuid) personnel.deviceUuid = meta.deviceUuid;
  if (meta?.ipAddress) personnel.ipAddress = meta.ipAddress;
  await personnel.save();

  await logEmsAction({
    userId: actorId, actorId, action: 'personnel_status_update',
    resource: 'ems_personnel', resourceId: personnel.badgeNumber,
    metadata: { status }, badgeNumber: personnel.badgeNumber,
    deviceUuid: meta?.deviceUuid, ipAddress: meta?.ipAddress,
  });

  const payload = await formatPersonnelWithUser(personnel);
  await broadcastEms('ems:personnel:status', payload);
  return payload;
}

export async function listUnits(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'units.view', userRole);
  const units = await EmsUnit.find({ deletedAt: null }).sort({ code: 1 });
  return units.map(formatUnit);
}

export async function updateUnitLocation(
  actorId: string,
  unitId: string,
  coords: { latitude: number; longitude: number; heading?: number; speed?: number },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'gps.live', userRole);
  const unit = await EmsUnit.findOne({ unitId, deletedAt: null });
  if (!unit) throw new Error('UNIT_NOT_FOUND');

  unit.latitude = coords.latitude;
  unit.longitude = coords.longitude;
  if (coords.heading !== undefined) unit.heading = coords.heading;
  if (coords.speed !== undefined) unit.speed = coords.speed;
  await unit.save();

  if (unit.ambulanceId) {
    await EmsAmbulance.findOneAndUpdate(
      { ambulanceId: unit.ambulanceId },
      { latitude: coords.latitude, longitude: coords.longitude }
    );
  }

  const payload = formatUnit(unit);
  await broadcastEms('ems:ambulance:gps', payload);
  await broadcastEms('ems:unit:update', payload);
  return payload;
}

export async function listDispatches(userId: string, userRole?: string, filters?: { is911?: boolean; status?: string }) {
  await assertEmsPermission(userId, 'dispatch.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (filters?.is911) query.is911 = true;
  if (filters?.status) query.status = filters.status;
  const dispatches = await EmsDispatch.find(query).sort({ priority: 1, createdAt: -1 }).limit(100);
  return dispatches.map(formatDispatch);
}

export async function createDispatch(
  actorId: string,
  data: {
    callType: string;
    priority: number;
    title: string;
    description: string;
    callerPhone?: string;
    patientName?: string;
    patientUserId?: string;
    address?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    is911?: boolean;
    isMassCasualty?: boolean;
    patientCount?: number;
  },
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const perm = data.is911 ? 'calls.911.manage' : 'dispatch.manage';
  await assertEmsPermission(actorId, perm, userRole);
  const personnel = await requirePersonnel(actorId);

  let destinationHospitalId: string | undefined;
  let etaMinutes: number | undefined;
  if (data.latitude && data.longitude) {
    const nearest = await findNearestHospital(data.latitude, data.longitude);
    if (nearest) {
      destinationHospitalId = nearest.hospital.hospitalId;
      etaMinutes = nearest.eta;
    }
  }

  const dispatch = await EmsDispatch.create({
    dispatchId: id('DSP'),
    ...data,
    patientUserId: data.patientUserId ? new Types.ObjectId(data.patientUserId) : undefined,
    status: 'pending',
    assignedBadgeNumbers: [],
    assignedPersonnelIds: [],
    destinationHospitalId,
    etaMinutes,
    createdBy: new Types.ObjectId(actorId),
  });

  await logEmsAction({
    userId: actorId, actorId, action: 'dispatch_create',
    resource: 'ems_dispatch', resourceId: dispatch.dispatchId,
    metadata: { is911: data.is911 }, badgeNumber: personnel.badgeNumber,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  const formatted = formatDispatch(dispatch);
  await broadcastEms(data.is911 ? 'ems:911:new' : 'ems:dispatch:new', formatted);
  await enqueueNotification({
    userId: actorId,
    title: data.is911 ? '911 Medical Call' : 'New EMS Dispatch',
    body: data.title,
    priority: data.priority === 1 ? 'critical' : 'high',
    appId: EMS_APP_BUNDLE,
  });
  return formatted;
}

export async function updateDispatch(
  actorId: string,
  dispatchId: string,
  updates: {
    status?: EmsDispatchStatus;
    assignedUnitId?: string;
    assignedBadgeNumbers?: string[];
    destinationHospitalId?: string;
    notes?: string;
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'dispatch.manage', userRole);
  const personnel = await requirePersonnel(actorId);
  const dispatch = await EmsDispatch.findOne({ dispatchId, deletedAt: null });
  if (!dispatch) throw new Error('DISPATCH_NOT_FOUND');

  if (updates.status) {
    dispatch.status = updates.status;
    if (updates.status === 'resolved') dispatch.resolvedAt = new Date();
  }
  if (updates.assignedUnitId) {
    dispatch.assignedUnitId = updates.assignedUnitId;
    const unit = await EmsUnit.findOne({ unitId: updates.assignedUnitId });
    if (unit) {
      unit.status = 'dispatched';
      await unit.save();
      if (dispatch.latitude && dispatch.longitude && unit.latitude && unit.longitude) {
        dispatch.etaMinutes = calculateEtaMinutes(unit.latitude, unit.longitude, dispatch.latitude, dispatch.longitude);
      }
    }
  }
  if (updates.assignedBadgeNumbers) dispatch.assignedBadgeNumbers = updates.assignedBadgeNumbers;
  if (updates.destinationHospitalId) dispatch.destinationHospitalId = updates.destinationHospitalId;
  if (updates.notes) dispatch.notes.push(updates.notes);
  await dispatch.save();

  await broadcastEms('ems:dispatch:update', formatDispatch(dispatch));
  return formatDispatch(dispatch);
}

export async function assignAmbulance(
  actorId: string,
  dispatchId: string,
  unitId: string,
  userRole?: string
) {
  await assertEmsPermission(actorId, 'dispatch.assign', userRole);
  return updateDispatch(actorId, dispatchId, { assignedUnitId: unitId, status: 'assigned' }, userRole);
}

export async function listPatients(userId: string, userRole?: string, status?: string) {
  await assertEmsPermission(userId, 'patients.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (status) query.status = status;
  const patients = await EmsPatient.find(query).sort({ updatedAt: -1 }).limit(100);
  return patients.map(formatPatient);
}

export async function getPatient(userId: string, patientId: string, userRole?: string) {
  await assertEmsPermission(userId, 'patients.view', userRole);
  const personnel = await requirePersonnel(userId);
  const patient = await EmsPatient.findOne({ patientId, deletedAt: null });
  if (!patient) throw new Error('PATIENT_NOT_FOUND');

  const [records, treatments, prescriptions, admissions] = await Promise.all([
    EmsMedicalRecord.find({ patientId, deletedAt: null }).sort({ createdAt: -1 }),
    EmsTreatment.find({ patientId, deletedAt: null }).sort({ administeredAt: -1 }),
    EmsPrescription.find({ patientId, deletedAt: null }).sort({ prescribedAt: -1 }),
    EmsAdmission.find({ patientId, deletedAt: null }).sort({ admittedAt: -1 }),
  ]);

  await logMedicalAccess({
    recordId: records[0]?.recordId ?? patientId,
    patientId,
    accessedBy: userId,
    badgeNumber: personnel.badgeNumber,
    accessType: 'view',
  });

  return { ...formatPatient(patient), records, treatments, prescriptions, admissions };
}

export async function createPatient(
  actorId: string,
  data: {
    name: string;
    userId?: string;
    bloodType?: string;
    allergies?: string[];
    conditions?: string[];
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    insuranceProvider?: string;
    insurancePolicyId?: string;
    dispatchId?: string;
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'patients.create', userRole);
  const personnel = await requirePersonnel(actorId);

  const patient = await EmsPatient.create({
    patientId: id('PAT'),
    name: data.name,
    userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    bloodType: data.bloodType ?? 'unknown',
    allergies: data.allergies ?? [],
    conditions: data.conditions ?? [],
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    insuranceProvider: data.insuranceProvider,
    insurancePolicyId: data.insurancePolicyId,
    currentDispatchId: data.dispatchId,
    status: 'serious',
    createdBy: new Types.ObjectId(actorId),
  });

  await broadcastEms('ems:patient:update', formatPatient(patient));
  return formatPatient(patient);
}

export async function listMedicalRecords(userId: string, userRole?: string, patientId?: string) {
  await assertEmsPermission(userId, 'records.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (patientId) query.patientId = patientId;
  return EmsMedicalRecord.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function createMedicalRecord(
  actorId: string,
  data: {
    patientId: string;
    dispatchId?: string;
    chiefComplaint?: string;
    notes?: string;
    vitals?: Record<string, number>;
    injuries?: { description: string; severity: string; bodyPart: string }[];
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'records.create', userRole);
  const personnel = await requirePersonnel(actorId);
  const patient = await EmsPatient.findOne({ patientId: data.patientId, deletedAt: null });
  if (!patient) throw new Error('PATIENT_NOT_FOUND');

  const sig = createDigitalSignature(personnel.badgeNumber, `record:${data.patientId}`);
  const record = await EmsMedicalRecord.create({
    recordId: id('MED'),
    patientId: data.patientId,
    patientName: patient.name,
    patientUserId: patient.userId,
    dispatchId: data.dispatchId,
    chiefComplaint: data.chiefComplaint,
    notes: data.notes,
    createdByBadge: personnel.badgeNumber,
    signatureHash: sig,
    vitals: data.vitals ? [{
      at: new Date(),
      heartRate: data.vitals.heartRate,
      bloodPressureSystolic: data.vitals.bloodPressureSystolic,
      bloodPressureDiastolic: data.vitals.bloodPressureDiastolic,
      respiratoryRate: data.vitals.respiratoryRate,
      oxygenSaturation: data.vitals.oxygenSaturation,
      temperature: data.vitals.temperature,
      glucose: data.vitals.glucose,
      recordedByBadge: personnel.badgeNumber,
    }] : [],
    injuries: (data.injuries ?? []).map((i) => ({ ...i, at: new Date() })),
    history: [{ at: new Date(), event: 'Record created', badgeNumber: personnel.badgeNumber }],
    createdBy: new Types.ObjectId(actorId),
  });

  await logMedicalAccess({
    recordId: record.recordId,
    patientId: data.patientId,
    accessedBy: actorId,
    badgeNumber: personnel.badgeNumber,
    accessType: 'create',
  });

  return record;
}

export async function createTreatment(
  actorId: string,
  data: {
    patientId: string;
    recordId?: string;
    dispatchId?: string;
    treatmentType: string;
    description: string;
    medication?: string;
    dosage?: string;
    outcome?: string;
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'treatments.create', userRole);
  const personnel = await requirePersonnel(actorId);
  const sig = createDigitalSignature(personnel.badgeNumber, `treatment:${data.patientId}`);

  const treatment = await EmsTreatment.create({
    treatmentId: id('TRT'),
    ...data,
    administeredByBadge: personnel.badgeNumber,
    signatureHash: sig,
    createdBy: new Types.ObjectId(actorId),
  });

  await EmsPatient.findOneAndUpdate(
    { patientId: data.patientId },
    { lastTreatmentAt: new Date() }
  );

  await broadcastEms('ems:patient:update', { patientId: data.patientId, treatmentId: treatment.treatmentId });
  return treatment;
}

export async function createPrescription(
  actorId: string,
  data: {
    patientId: string;
    recordId?: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'prescriptions.create', userRole);
  const personnel = await requirePersonnel(actorId);
  const sig = createDigitalSignature(personnel.badgeNumber, `rx:${data.patientId}:${data.medication}`);

  return EmsPrescription.create({
    prescriptionId: id('RX'),
    ...data,
    prescribedByBadge: personnel.badgeNumber,
    signatureHash: sig,
    createdBy: new Types.ObjectId(actorId),
  });
}

export async function listHospitals(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'hospital.view', userRole);
  return EmsHospital.find({ deletedAt: null });
}

export async function getHospitalDetail(userId: string, hospitalId: string, userRole?: string) {
  await assertEmsPermission(userId, 'hospital.view', userRole);
  const hospital = await EmsHospital.findOne({ hospitalId, deletedAt: null });
  if (!hospital) throw new Error('HOSPITAL_NOT_FOUND');

  const [departments, beds, admissions] = await Promise.all([
    EmsDepartment.find({ hospitalId, deletedAt: null }),
    EmsBed.find({ hospitalId, deletedAt: null }),
    EmsAdmission.find({ hospitalId, status: { $in: ['pending', 'admitted', 'in_treatment'] }, deletedAt: null }),
  ]);

  return { hospital, departments, beds, admissions, waitingQueue: admissions.filter((a) => a.status === 'pending').length };
}

export async function admitPatient(
  actorId: string,
  data: { patientId: string; hospitalId: string; departmentId: string; diagnosis: string; dispatchId?: string },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'hospital.admit', userRole);
  const personnel = await requirePersonnel(actorId);
  const patient = await EmsPatient.findOne({ patientId: data.patientId, deletedAt: null });
  if (!patient) throw new Error('PATIENT_NOT_FOUND');

  const dept = await EmsDepartment.findOne({ departmentId: data.departmentId, deletedAt: null });
  if (!dept) throw new Error('DEPARTMENT_NOT_FOUND');

  const bed = await EmsBed.findOne({ departmentId: data.departmentId, status: 'available', deletedAt: null });
  if (bed) {
    bed.status = 'occupied';
    bed.patientId = data.patientId;
    bed.assignedAt = new Date();
    await bed.save();
    dept.occupiedBeds += 1;
    await dept.save();

    const hospital = await EmsHospital.findOne({ hospitalId: data.hospitalId });
    if (hospital) {
      hospital.availableBeds = Math.max(0, hospital.availableBeds - 1);
      if (dept.type === 'er') hospital.erOccupied += 1;
      await hospital.save();
      await broadcastEms('ems:hospital:capacity', await getHospitalCapacity());
    }
  }

  const admission = await EmsAdmission.create({
    admissionId: id('ADM'),
    patientId: data.patientId,
    patientName: patient.name,
    hospitalId: data.hospitalId,
    departmentId: data.departmentId,
    bedId: bed?.bedId,
    dispatchId: data.dispatchId,
    admittingBadge: personnel.badgeNumber,
    diagnosis: data.diagnosis,
    status: bed ? 'admitted' : 'pending',
    queuePosition: bed ? undefined : dept.waitingQueue + 1,
    createdBy: new Types.ObjectId(actorId),
  });

  if (!bed) {
    dept.waitingQueue += 1;
    await dept.save();
    await broadcastEms('ems:queue:update', { hospitalId: data.hospitalId, departmentId: data.departmentId, queue: dept.waitingQueue });
  }

  patient.status = 'admitted';
  patient.currentHospitalId = data.hospitalId;
  patient.currentAdmissionId = admission.admissionId;
  await patient.save();

  await broadcastEms('ems:admission:update', { admissionId: admission.admissionId, status: admission.status });
  return admission;
}

export async function dischargePatient(
  actorId: string,
  admissionId: string,
  dischargeNotes?: string,
  userRole?: string
) {
  await assertEmsPermission(actorId, 'hospital.discharge', userRole);
  const personnel = await requirePersonnel(actorId);
  const admission = await EmsAdmission.findOne({ admissionId, deletedAt: null });
  if (!admission) throw new Error('ADMISSION_NOT_FOUND');

  admission.status = 'discharged';
  admission.dischargedAt = new Date();
  admission.dischargedByBadge = personnel.badgeNumber;
  admission.dischargeNotes = dischargeNotes;
  await admission.save();

  if (admission.bedId) {
    const bed = await EmsBed.findOne({ bedId: admission.bedId });
    if (bed) {
      bed.status = 'available';
      bed.patientId = undefined;
      bed.admissionId = undefined;
      await bed.save();
    }
    const dept = await EmsDepartment.findOne({ departmentId: admission.departmentId });
    if (dept) {
      dept.occupiedBeds = Math.max(0, dept.occupiedBeds - 1);
      await dept.save();
    }
    const hospital = await EmsHospital.findOne({ hospitalId: admission.hospitalId });
    if (hospital) {
      hospital.availableBeds += 1;
      await hospital.save();
      await broadcastEms('ems:hospital:capacity', await getHospitalCapacity());
    }
  }

  await EmsPatient.findOneAndUpdate(
    { patientId: admission.patientId },
    { status: 'discharged', currentHospitalId: undefined, currentAdmissionId: undefined }
  );

  return admission;
}

export async function listAmbulances(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'ambulances.view', userRole);
  return EmsAmbulance.find({ deletedAt: null });
}

export async function listIncidents(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'incidents.view', userRole);
  return EmsIncident.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(50);
}

export async function createIncident(
  actorId: string,
  data: {
    title: string;
    description: string;
    type: string;
    location: string;
    district: string;
    latitude?: number;
    longitude?: number;
    patientCount?: number;
    criticalCount?: number;
    policeDispatchId?: string;
  },
  userRole?: string
) {
  await assertEmsPermission(actorId, 'incidents.manage', userRole);
  const personnel = await requirePersonnel(actorId);

  const incident = await EmsIncident.create({
    incidentId: id('INC'),
    ...data,
    status: 'active',
    commanderBadge: personnel.badgeNumber,
    assignedUnitIds: [],
    assignedDispatchIds: [],
    timeline: [{ at: new Date(), event: 'Incident declared', badgeNumber: personnel.badgeNumber }],
    createdBy: new Types.ObjectId(actorId),
  });

  await broadcastEms('ems:incident:update', { incidentId: incident.incidentId, status: 'active' });
  await broadcastEms('ems:alert', { type: 'mass_casualty', title: data.title, incidentId: incident.incidentId });
  await enqueueNotification({
    userId: actorId,
    title: 'MASS CASUALTY INCIDENT',
    body: data.title,
    priority: 'critical',
    appId: EMS_APP_BUNDLE,
  });
  return incident;
}

export async function dispatchHelicopter(
  actorId: string,
  dispatchId: string,
  userRole?: string
) {
  await assertEmsPermission(actorId, 'helicopter.dispatch', userRole);
  const personnel = await requirePersonnel(actorId);
  const dispatch = await EmsDispatch.findOne({ dispatchId, deletedAt: null });
  if (!dispatch) throw new Error('DISPATCH_NOT_FOUND');

  dispatch.isHelicopter = true;
  dispatch.assignedUnitId = 'EMS-AIR';
  dispatch.status = 'assigned';
  await dispatch.save();

  const airUnit = await EmsUnit.findOne({ unitId: 'EMS-AIR' });
  if (airUnit) {
    airUnit.status = 'dispatched';
    await airUnit.save();
  }

  await broadcastEms('ems:helicopter:dispatch', { dispatchId, unitId: 'EMS-AIR' });
  await logEmsAction({
    userId: actorId, actorId, action: 'helicopter_dispatch',
    resource: 'ems_dispatch', resourceId: dispatchId,
    badgeNumber: personnel.badgeNumber,
  });

  return formatDispatch(dispatch);
}

export async function routeToHospital(
  actorId: string,
  dispatchId: string,
  hospitalId?: string,
  userRole?: string
) {
  await assertEmsPermission(actorId, 'hospital.route', userRole);
  const dispatch = await EmsDispatch.findOne({ dispatchId, deletedAt: null });
  if (!dispatch) throw new Error('DISPATCH_NOT_FOUND');

  let targetHospitalId = hospitalId;
  let eta = dispatch.etaMinutes;

  if (!targetHospitalId && dispatch.latitude && dispatch.longitude) {
    const nearest = await findNearestHospital(dispatch.latitude, dispatch.longitude);
    if (nearest) {
      targetHospitalId = nearest.hospital.hospitalId;
      eta = nearest.eta;
    }
  }

  if (!targetHospitalId) throw new Error('NO_HOSPITAL_AVAILABLE');

  dispatch.destinationHospitalId = targetHospitalId;
  dispatch.etaMinutes = eta;
  dispatch.status = 'transporting';
  await dispatch.save();

  return formatDispatch(dispatch);
}

export async function listPersonnel(userId: string, userRole?: string, role?: string) {
  await assertEmsPermission(userId, 'mdt.access', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (role) query.role = role;
  const list = await EmsPersonnel.find(query).sort({ badgeNumber: 1 });
  return Promise.all(list.map(formatPersonnelWithUser));
}

export async function performSearch(
  actorId: string,
  searchType: string,
  query: string,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const permMap: Record<string, string> = {
    citizen: 'search.citizen', identity: 'search.identity', phone: 'search.phone',
    record: 'search.record', blood_type: 'search.blood_type',
    emergency_contact: 'search.emergency_contact', insurance: 'search.insurance',
    allergies: 'search.allergies', treatments: 'search.treatments',
  };
  await assertEmsPermission(actorId, permMap[searchType] as never, userRole);
  const personnel = await requirePersonnel(actorId);

  let results: unknown;
  switch (searchType) {
    case 'citizen': results = await searchCitizen(query); break;
    case 'identity': results = await searchIdentity(query); break;
    case 'phone': results = await searchPhone(query); break;
    case 'record': results = await searchMedicalRecord(query); break;
    case 'blood_type': results = await searchByBloodType(query); break;
    case 'emergency_contact': results = await searchEmergencyContact(query); break;
    case 'insurance': results = await searchInsurance(query); break;
    case 'allergies': results = await searchAllergies(query); break;
    case 'treatments': results = await searchPreviousTreatments(query); break;
    default: throw new Error('INVALID_SEARCH_TYPE');
  }

  const log = await EmsSearchLog.create({
    searchId: id('SRC'),
    searchType,
    query,
    personnelId: personnel.userId,
    badgeNumber: personnel.badgeNumber,
    results: { data: results },
    resultCount: Array.isArray(results) ? results.length : 1,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
    createdBy: new Types.ObjectId(actorId),
  });

  await logEmsAction({
    userId: actorId, actorId, action: 'ems_search',
    resource: 'ems_search', resourceId: log.searchId,
    metadata: { searchType, query }, badgeNumber: personnel.badgeNumber,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  await emitToUser(actorId, 'ems:search:complete', { searchId: log.searchId, searchType });
  return { searchId: log.searchId, searchType, query, results };
}

export async function getAnalytics(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'analytics.view', userRole);

  const [dispatches, patients, treatments, admissions, incidents] = await Promise.all([
    EmsDispatch.countDocuments({ deletedAt: null }),
    EmsPatient.countDocuments({ deletedAt: null }),
    EmsTreatment.countDocuments({ deletedAt: null }),
    EmsAdmission.countDocuments({ deletedAt: null }),
    EmsIncident.countDocuments({ deletedAt: null }),
  ]);

  const byStatus = await EmsDispatch.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byDistrict = await EmsDispatch.aggregate([
    { $match: { deletedAt: null, district: { $exists: true, $ne: '' } } },
    { $group: { _id: '$district', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    dispatches, patients, treatments, admissions, incidents,
    dispatchesByStatus: byStatus,
    dispatchesByDistrict: byDistrict,
    hospitalCapacity: await getHospitalCapacity(),
  };
}

export async function getRbac(userId: string, userRole?: string) {
  await assertEmsPermission(userId, 'audit.view', userRole);
  return Promise.all(
    EMS_ROLES.map(async (role) => ({
      role,
      permissions: await getRolePermissions(role),
    }))
  );
}

export async function updateRbac(actorId: string, role: EmsRole, permissions: string[], userRole?: string) {
  await assertEmsPermission(actorId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, actorId);
}

export async function broadcastAlert(actorId: string, title: string, body: string, userRole?: string) {
  await assertEmsPermission(actorId, 'alerts.broadcast', userRole);
  const personnel = await requirePersonnel(actorId);
  await broadcastEms('ems:alert', { title, body, badgeNumber: personnel.badgeNumber, at: new Date().toISOString() });
  await enqueueNotification({
    userId: actorId,
    title,
    body,
    priority: 'critical',
    appId: EMS_APP_BUNDLE,
  });
  return { broadcast: true };
}

export { getRolePermissions, updateRolePermissions };
