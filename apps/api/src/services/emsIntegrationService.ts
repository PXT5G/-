import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { EmsPatient } from '../database/models/EmsPatient';
import { EmsMedicalRecord } from '../database/models/EmsMedicalRecord';
import { EmsTreatment } from '../database/models/EmsTreatment';
import { EmsHospital } from '../database/models/EmsHospital';
import { EmsMedicalAccessLog } from '../database/models/EmsMedicalAccessLog';
import { EmsDutyLog } from '../database/models/EmsDutyLog';
import { PoliceDispatch } from '../database/models/PoliceDispatch';
import { logAudit } from './auditService';
import {
  searchIdentity,
  searchPhone,
  getBankIntegration,
  getWorldLocation,
} from './policeIntegrationService';

export async function logEmsAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  badgeNumber?: string;
  signatureHash?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: {
      ...params.metadata,
      deviceUuid: params.deviceUuid,
      badgeNumber: params.badgeNumber,
      signatureHash: params.signatureHash,
    },
    ipAddress: params.ipAddress,
  });

  if (params.badgeNumber) {
    await EmsDutyLog.create({
      logId: `LOG-${uuidv4().slice(0, 8).toUpperCase()}`,
      personnelId: new Types.ObjectId(params.actorId),
      badgeNumber: params.badgeNumber,
      action: params.action,
      details: params.resourceId ?? params.resource,
      resourceType: params.resource,
      resourceId: params.resourceId,
      deviceUuid: params.deviceUuid,
      ipAddress: params.ipAddress,
      signatureHash: params.signatureHash,
      createdBy: new Types.ObjectId(params.actorId),
    });
  }
}

export async function logMedicalAccess(params: {
  recordId: string;
  patientId: string;
  accessedBy: string;
  badgeNumber: string;
  accessType: 'view' | 'create' | 'update' | 'export';
  reason?: string;
  ipAddress?: string;
  deviceUuid?: string;
}) {
  await EmsMedicalAccessLog.create({
    accessId: `ACC-${uuidv4().slice(0, 8).toUpperCase()}`,
    recordId: params.recordId,
    patientId: params.patientId,
    accessedBy: new Types.ObjectId(params.accessedBy),
    badgeNumber: params.badgeNumber,
    accessType: params.accessType,
    reason: params.reason,
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
    createdBy: new Types.ObjectId(params.accessedBy),
  });
}

export async function searchCitizen(query: string) {
  return searchIdentity(query);
}

export async function searchMedicalRecord(query: string) {
  const patients = await EmsPatient.find({
    $or: [
      { patientId: new RegExp(query, 'i') },
      { name: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);

  const records = await EmsMedicalRecord.find({
    $or: [
      { recordId: new RegExp(query, 'i') },
      { patientName: new RegExp(query, 'i') },
      { chiefComplaint: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);

  return {
    patients: patients.map((p) => ({
      patientId: p.patientId,
      name: p.name,
      bloodType: p.bloodType,
      status: p.status,
      allergies: p.allergies,
      conditions: p.conditions,
    })),
    records: records.map((r) => ({
      recordId: r.recordId,
      patientId: r.patientId,
      patientName: r.patientName,
      chiefComplaint: r.chiefComplaint,
      vitalsCount: r.vitals.length,
      diagnosesCount: r.diagnoses.length,
    })),
  };
}

export async function searchByBloodType(bloodType: string) {
  return EmsPatient.find({ bloodType: bloodType.toUpperCase(), deletedAt: null }).limit(20);
}

export async function searchEmergencyContact(query: string) {
  return EmsPatient.find({
    $or: [
      { emergencyContactName: new RegExp(query, 'i') },
      { emergencyContactPhone: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);
}

export async function searchInsurance(query: string) {
  return EmsPatient.find({
    $or: [
      { insuranceProvider: new RegExp(query, 'i') },
      { insurancePolicyId: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);
}

export async function searchAllergies(query: string) {
  return EmsPatient.find({
    allergies: new RegExp(query, 'i'),
    deletedAt: null,
  }).limit(20);
}

export async function searchPreviousTreatments(query: string) {
  const treatments = await EmsTreatment.find({
    $or: [
      { description: new RegExp(query, 'i') },
      { medication: new RegExp(query, 'i') },
      { patientId: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).sort({ administeredAt: -1 }).limit(20);

  return treatments.map((t) => ({
    treatmentId: t.treatmentId,
    patientId: t.patientId,
    treatmentType: t.treatmentType,
    description: t.description,
    medication: t.medication,
    administeredAt: t.administeredAt.toISOString(),
    administeredByBadge: t.administeredByBadge,
  }));
}

export async function getPatientFromUser(userId: string) {
  let patient = await EmsPatient.findOne({ userId, deletedAt: null });
  if (patient) return patient;

  const user = await User.findById(userId);
  if (!user) return null;

  const profile = await DeviceProfile.findOne({ userId });
  return {
    userId: user._id.toString(),
    name: user.displayName,
    username: user.username,
    governmentId: profile?.serialNumber,
    existingPatient: false,
  };
}

export async function getMedical911Calls() {
  return PoliceDispatch.find({
    is911: true,
    status: { $ne: 'resolved' },
    deletedAt: null,
    $or: [
      { callType: '911' },
      { title: /medical|injury|cardiac|overdose|accident/i },
    ],
  }).sort({ priority: 1, createdAt: -1 }).limit(30);
}

export function calculateEtaMinutes(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  speedKmh = 60
): number {
  const R = 6371;
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

export async function findNearestHospital(latitude: number, longitude: number) {
  const hospitals = await EmsHospital.find({ status: 'open', deletedAt: null, availableBeds: { $gt: 0 } });
  if (!hospitals.length) return null;

  const ranked = hospitals.map((h) => ({
    hospital: h,
    eta: calculateEtaMinutes(latitude, longitude, h.latitude, h.longitude),
    distance: Math.sqrt((h.latitude - latitude) ** 2 + (h.longitude - longitude) ** 2),
  })).sort((a, b) => a.eta - b.eta);

  return ranked[0];
}

export async function getHospitalCapacity() {
  const hospitals = await EmsHospital.find({ deletedAt: null });
  return hospitals.map((h) => ({
    hospitalId: h.hospitalId,
    name: h.name,
    availableBeds: h.availableBeds,
    totalBeds: h.totalBeds,
    erCapacity: h.erCapacity,
    erOccupied: h.erOccupied,
    orAvailable: h.orAvailable,
    status: h.status,
    occupancyRate: h.totalBeds > 0 ? Math.round((1 - h.availableBeds / h.totalBeds) * 100) : 0,
  }));
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
