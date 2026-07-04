import {
  identityBridgeService,
  permissionEngineService,
  auditService,
  notificationService,
  eventBusService,
  BANANAOS_APP_IDS,
} from '../platform';
import { PoliceCase } from '../database/models/PoliceCase';
import { PoliceVehicle } from '../database/models/PoliceVehicle';

const JUSTICE_APP_ID = BANANAOS_APP_IDS.JUSTICE;
const JUSTICE_PERMISSIONS = ['view_cases', 'view_vehicles', 'file_charges', 'view_court_records'];

export async function initializeJusticePermissions(userId: string, grantedBy: string): Promise<void> {
  await permissionEngineService.grantPermissions(JUSTICE_APP_ID, userId, JUSTICE_PERMISSIONS, grantedBy);
}

export async function lookupPoliceCase(userId: string, query: string, userRole: 'user' | 'admin') {
  await permissionEngineService.requirePermission(JUSTICE_APP_ID, userId, 'view_cases', userRole);
  await identityBridgeService.assertIdentityGate(userId, JUSTICE_APP_ID);

  const regex = new RegExp(query.trim(), 'i');
  const cases = await PoliceCase.find({
    $or: [{ caseNumber: regex }, { title: regex }, { involvedParties: regex }],
  }).limit(20).lean();

  await auditService.log({
    appId: JUSTICE_APP_ID,
    userId,
    action: 'justice_case_lookup',
    entityType: 'PoliceCase',
    ctx: { performedBy: userId, performedByRole: userRole, permission: 'view_cases' },
    query,
    metadata: { resultCount: cases.length },
  });

  return cases.map((c) => ({
    id: c._id.toString(),
    caseNumber: c.caseNumber,
    title: c.title,
    status: c.status,
    priority: c.priority,
  }));
}

export async function lookupPoliceVehicle(userId: string, query: string, userRole: 'user' | 'admin') {
  await permissionEngineService.requirePermission(JUSTICE_APP_ID, userId, 'view_vehicles', userRole);
  await identityBridgeService.assertIdentityGate(userId, JUSTICE_APP_ID);

  const regex = new RegExp(query.trim(), 'i');
  const vehicles = await PoliceVehicle.find({
    $or: [{ plateNumber: regex }, { ownerName: regex }],
  }).limit(20).lean();

  await auditService.log({
    appId: JUSTICE_APP_ID,
    userId,
    action: 'justice_vehicle_lookup',
    entityType: 'PoliceVehicle',
    ctx: { performedBy: userId, performedByRole: userRole, permission: 'view_vehicles' },
    query,
    metadata: { resultCount: vehicles.length },
  });

  return vehicles.map((v) => ({
    id: v._id.toString(),
    plateNumber: v.plateNumber,
    make: v.make,
    vehicleModel: v.vehicleModel,
    ownerName: v.ownerName,
    status: v.status,
  }));
}

export async function notifyCourtUpdate(userId: string, title: string, body: string): Promise<void> {
  await notificationService.send({
    userId,
    appId: JUSTICE_APP_ID,
    title,
    body,
    icon: '⚖️',
    priority: 'high',
  });
  eventBusService.emitToUser(userId, 'system:broadcast', { appId: JUSTICE_APP_ID, title, body });
}
