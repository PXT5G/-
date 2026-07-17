/** GULF EMS — com.gulfos.ems constants */

export const EMS_APP_BUNDLE = 'com.gulfos.ems' as const;

export const EMS_ROLES = [
  'chief_ems',
  'deputy',
  'doctor',
  'surgeon',
  'paramedic',
  'nurse',
  'dispatcher',
  'trainee',
  'administrator',
] as const;

export type EmsRole = (typeof EMS_ROLES)[number];

export const EMS_PERMISSIONS = [
  'mdt.access',
  'dashboard.view',
  'units.view',
  'units.manage',
  'dispatch.view',
  'dispatch.manage',
  'dispatch.assign',
  'calls.911.view',
  'calls.911.manage',
  'gps.live',
  'gps.track',
  'eta.calculate',
  'hospital.route',
  'helicopter.dispatch',
  'mass_casualty.manage',
  'patients.view',
  'patients.create',
  'patients.manage',
  'records.view',
  'records.create',
  'records.manage',
  'records.access_log',
  'treatments.view',
  'treatments.create',
  'treatments.manage',
  'prescriptions.view',
  'prescriptions.create',
  'prescriptions.manage',
  'hospital.view',
  'hospital.manage',
  'hospital.admit',
  'hospital.discharge',
  'beds.view',
  'beds.manage',
  'departments.view',
  'departments.manage',
  'staff.doctors.view',
  'staff.nurses.view',
  'pharmacy.view',
  'pharmacy.manage',
  'or.view',
  'or.manage',
  'queue.view',
  'queue.manage',
  'ambulances.view',
  'ambulances.manage',
  'incidents.view',
  'incidents.manage',
  'search.citizen',
  'search.identity',
  'search.phone',
  'search.record',
  'search.blood_type',
  'search.emergency_contact',
  'search.insurance',
  'search.allergies',
  'search.treatments',
  'analytics.view',
  'alerts.broadcast',
  'chat.internal',
  'audit.view',
  'rbac.configure',
  'signatures.create',
  'signatures.verify',
] as const;

export type EmsPermission = (typeof EMS_PERMISSIONS)[number];

export const PERSONNEL_STATUSES = ['on_duty', 'off_duty', 'en_route', 'on_scene', 'at_hospital', 'unavailable'] as const;
export type PersonnelStatus = (typeof PERSONNEL_STATUSES)[number];

export const DISPATCH_STATUSES = ['pending', 'assigned', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'resolved', 'cancelled'] as const;
export type EmsDispatchStatus = (typeof DISPATCH_STATUSES)[number];

export const DISPATCH_PRIORITIES = [1, 2, 3] as const;
export const CALL_TYPES = ['911_medical', 'non_emergency', 'inter_facility', 'standby', 'mass_casualty', 'helicopter'] as const;

export const UNIT_STATUSES = ['available', 'dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'offline'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const PATIENT_STATUSES = ['stable', 'critical', 'serious', 'deceased', 'discharged', 'admitted'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const ADMISSION_STATUSES = ['pending', 'admitted', 'in_treatment', 'discharged', 'transferred'] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const BED_STATUSES = ['available', 'occupied', 'reserved', 'maintenance'] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export const INCIDENT_STATUSES = ['active', 'contained', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const TREATMENT_TYPES = ['first_aid', 'medication', 'procedure', 'surgery', 'observation', 'therapy'] as const;
export type TreatmentType = (typeof TREATMENT_TYPES)[number];

export const DEFAULT_EMS_ROLE_PERMISSIONS: Record<EmsRole, EmsPermission[]> = {
  chief_ems: [...EMS_PERMISSIONS],
  deputy: EMS_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  doctor: EMS_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'dispatch.manage', 'dispatch.assign', 'helicopter.dispatch', 'mass_casualty.manage', 'units.manage', 'ambulances.manage'].includes(p)
  ),
  surgeon: EMS_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'patients.view', 'patients.manage', 'records.view', 'records.create', 'records.manage',
      'treatments.view', 'treatments.create', 'treatments.manage', 'prescriptions.view', 'prescriptions.create',
      'hospital.view', 'hospital.admit', 'hospital.discharge', 'beds.view', 'or.view', 'or.manage', 'queue.view',
      'search.citizen', 'search.identity', 'search.record', 'search.allergies', 'search.treatments', 'chat.internal',
      'signatures.create'].includes(p)
  ),
  paramedic: EMS_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'gps.live', 'eta.calculate', 'hospital.route',
      'patients.view', 'patients.create', 'records.view', 'records.create', 'treatments.view', 'treatments.create',
      'prescriptions.view', 'ambulances.view', 'incidents.view', 'search.citizen', 'search.identity', 'search.phone',
      'search.record', 'search.blood_type', 'search.emergency_contact', 'search.allergies', 'chat.internal'].includes(p)
  ),
  nurse: EMS_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'patients.view', 'records.view', 'records.create', 'treatments.view',
      'treatments.create', 'prescriptions.view', 'hospital.view', 'hospital.admit', 'beds.view', 'queue.view',
      'pharmacy.view', 'search.citizen', 'search.record', 'search.allergies', 'chat.internal'].includes(p)
  ),
  dispatcher: EMS_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'units.manage', 'dispatch.view', 'dispatch.manage', 'dispatch.assign',
      'calls.911.view', 'calls.911.manage', 'gps.live', 'gps.track', 'eta.calculate', 'hospital.route',
      'helicopter.dispatch', 'mass_casualty.manage', 'patients.view', 'hospital.view', 'beds.view', 'queue.view',
      'ambulances.view', 'ambulances.manage', 'incidents.view', 'incidents.manage', 'analytics.view',
      'alerts.broadcast', 'chat.internal'].includes(p)
  ),
  trainee: ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'patients.view', 'records.view', 'chat.internal'],
  administrator: EMS_PERMISSIONS.filter((p) => p !== 'rbac.configure' && !p.startsWith('prescriptions.create') && !p.startsWith('treatments.create')),
};

export const EMS_SOCKET_EVENTS = [
  'ems:initialized',
  'ems:dispatch:new',
  'ems:dispatch:update',
  'ems:unit:update',
  'ems:personnel:status',
  'ems:911:new',
  'ems:patient:update',
  'ems:ambulance:gps',
  'ems:hospital:capacity',
  'ems:incident:update',
  'ems:alert',
  'ems:helicopter:dispatch',
  'ems:search:complete',
  'ems:admission:update',
  'ems:queue:update',
] as const;
