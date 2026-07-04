import { Types } from 'mongoose';
import crypto from 'crypto';
import { CompanyEmployee } from '../database/models/CompanyEmployee';
import { CompanyRole } from '../database/models/CompanyRole';
import { CompanyPermission } from '../database/models/CompanyPermission';
import { Company } from '../database/models/Company';
import {
  BUSINESS_APP_BUNDLE,
  BUSINESS_ROLES,
  DEFAULT_BUSINESS_ROLE_PERMISSIONS,
  type BusinessPermission,
  type BusinessRole,
} from '../constants/business';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedBusinessRoleConfigs(): Promise<void> {
  for (const role of BUSINESS_ROLES) {
    await CompanyRole.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_BUSINESS_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getEmployeeProfile(userId: string, companyId?: string) {
  const filter: Record<string, unknown> = { userId, deletedAt: null };
  if (companyId) filter.companyId = companyId;
  return CompanyEmployee.findOne(filter);
}

export async function requireEmployee(userId: string, companyId?: string) {
  const employee = await getEmployeeProfile(userId, companyId);
  if (!employee) throw new Error('NOT_BUSINESS_EMPLOYEE');
  return employee;
}

export async function getRolePermissions(role: BusinessRole): Promise<BusinessPermission[]> {
  const config = await CompanyRole.findOne({ role });
  return (config?.permissions ?? DEFAULT_BUSINESS_ROLE_PERMISSIONS[role]) as BusinessPermission[];
}

export async function updateRolePermissions(
  role: BusinessRole,
  permissions: BusinessPermission[],
  actorId: string
): Promise<BusinessPermission[]> {
  await CompanyRole.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'business_rbac_update',
    resource: 'business_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkBusinessPermission(
  userId: string,
  permission: BusinessPermission,
  companyId?: string,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, BUSINESS_APP_BUNDLE, 'location');
  if (!hasApp) return false;

  if (companyId) {
    const company = await Company.findOne({ companyId, deletedAt: null });
    if (company?.ownerUserId.toString() === userId) return true;
  }

  const employee = await getEmployeeProfile(userId, companyId);
  if (!employee || employee.status === 'terminated' || employee.status === 'suspended') {
    if (companyId) {
      const company = await Company.findOne({ companyId, deletedAt: null });
      if (company?.ownerUserId.toString() === userId) return true;
    }
    return false;
  }

  const customGrants = await CompanyPermission.find({
    userId,
    companyId: employee.companyId,
    permission,
    deletedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  if (customGrants.length > 0) return true;

  if (employee.permissions.includes(permission)) return true;

  const rolePermissions = await getRolePermissions(employee.role);
  return rolePermissions.includes(permission);
}

export async function assertBusinessPermission(
  userId: string,
  permission: BusinessPermission,
  companyId?: string,
  userRole?: string
): Promise<void> {
  const allowed = await checkBusinessPermission(userId, permission, companyId, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(employeeId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${employeeId}:${payload}:${Date.now()}`).digest('hex');
}

export function formatEmployee(
  employee: InstanceType<typeof CompanyEmployee>,
  user?: { displayName?: string; username?: string; avatar?: string }
) {
  return {
    employeeId: employee.employeeId,
    companyId: employee.companyId,
    userId: employee.userId.toString(),
    branchId: employee.branchId,
    departmentId: employee.departmentId,
    role: employee.role,
    jobTitle: employee.jobTitle,
    rank: employee.rank,
    status: employee.status,
    salary: employee.salary,
    bonus: employee.bonus,
    commissionRate: employee.commissionRate,
    performanceScore: employee.performanceScore,
    hireDate: employee.hireDate.toISOString(),
    displayName: user?.displayName,
    username: user?.username,
    avatar: user?.avatar,
  };
}
