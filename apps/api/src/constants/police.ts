/** GULF Police — com.gulfos.police constants */

export const POLICE_APP_BUNDLE = 'com.gulfos.police' as const;

export const POLICE_ROLES = [
  'chief',
  'deputy_chief',
  'captain',
  'lieutenant',
  'sergeant',
  'corporal',
  'officer',
  'cadet',
  'dispatcher',
  'detective',
  'swat',
  'traffic',
  'air_support',
  'investigation',
] as const;

export type PoliceRole = (typeof POLICE_ROLES)[number];

export const POLICE_PERMISSIONS = [
  'mdt.access',
  'dashboard.view',
  'units.view',
  'units.manage',
  'dispatch.view',
  'dispatch.manage',
  'dispatch.assign',
  'calls.911.view',
  'calls.911.manage',
  'calls.active.view',
  'officer.status.update',
  'gps.live',
  'gps.track',
  'bolo.view',
  'bolo.create',
  'bolo.manage',
  'wanted.view',
  'wanted.manage',
  'warrants.view',
  'warrants.create',
  'warrants.manage',
  'search.person',
  'search.vehicle',
  'search.plate',
  'search.property',
  'search.business',
  'search.phone',
  'search.identity',
  'search.weapon',
  'evidence.view',
  'evidence.create',
  'evidence.manage',
  'evidence.locker',
  'bodycam.view',
  'bodycam.upload',
  'reports.incident',
  'reports.crime',
  'reports.arrest',
  'citations.create',
  'warnings.create',
  'fines.calculate',
  'jail.calculate',
  'court.request',
  'cases.view',
  'cases.manage',
  'investigation.timeline',
  'gangs.view',
  'gangs.manage',
  'organizations.view',
  'organizations.manage',
  'notes.create',
  'notes.view',
  'chat.internal',
  'announcements.broadcast',
  'shifts.manage',
  'duty.log',
  'promotions.manage',
  'ranks.manage',
  'points.manage',
  'training.view',
  'training.manage',
  'attendance.manage',
  'leave.manage',
  'complaints.view',
  'complaints.manage',
  'discipline.manage',
  'equipment.manage',
  'vehicles.manage',
  'weapons.manage',
  'inventory.manage',
  'impound.manage',
  'tow.request',
  'roadblocks.deploy',
  'spikes.deploy',
  'panic.trigger',
  'emergency.broadcast',
  'analytics.view',
  'heatmap.view',
  'audit.view',
  'rbac.configure',
] as const;

export type PolicePermission = (typeof POLICE_PERMISSIONS)[number];

export const OFFICER_STATUSES = ['on_duty', 'off_duty', 'break', 'en_route', 'on_scene', 'unavailable', 'panic'] as const;
export type OfficerStatus = (typeof OFFICER_STATUSES)[number];

export const DISPATCH_PRIORITIES = [1, 2, 3] as const;
export const DISPATCH_STATUSES = ['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled'] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export const CALL_TYPES = ['911', 'non_emergency', 'officer_initiated', 'traffic', 'welfare_check'] as const;

export const REPORT_TYPES = ['incident', 'crime', 'arrest'] as const;
export const REPORT_STATUSES = ['draft', 'filed', 'under_review', 'closed'] as const;

export const CITATION_TYPES = ['citation', 'warning'] as const;
export const CITATION_STATUSES = ['issued', 'paid', 'contested', 'voided'] as const;

export const WARRANT_STATUSES = ['active', 'served', 'expired', 'revoked'] as const;
export const BOLO_STATUSES = ['active', 'located', 'expired', 'cancelled'] as const;
export const CASE_STATUSES = ['open', 'investigating', 'pending_court', 'closed'] as const;

export const DANGER_LEVELS = ['low', 'medium', 'high', 'extreme'] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<PoliceRole, PolicePermission[]> = {
  chief: [...POLICE_PERMISSIONS],
  deputy_chief: POLICE_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  captain: POLICE_PERMISSIONS.filter((p) => !['rbac.configure', 'promotions.manage', 'ranks.manage'].includes(p)),
  lieutenant: POLICE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'promotions.manage', 'ranks.manage', 'discipline.manage', 'emergency.broadcast'].includes(p)
  ),
  sergeant: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'dispatch.assign', 'calls.911.view', 'calls.active.view',
      'officer.status.update', 'gps.live', 'bolo.view', 'bolo.create', 'wanted.view', 'warrants.view', 'search.person',
      'search.vehicle', 'search.plate', 'search.phone', 'search.identity', 'evidence.view', 'evidence.create',
      'reports.incident', 'reports.crime', 'reports.arrest', 'citations.create', 'warnings.create', 'cases.view',
      'notes.create', 'notes.view', 'chat.internal', 'duty.log', 'panic.trigger', 'analytics.view'].includes(p)
  ),
  corporal: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'officer.status.update',
      'gps.live', 'bolo.view', 'wanted.view', 'search.person', 'search.vehicle', 'search.plate', 'evidence.view',
      'reports.incident', 'citations.create', 'warnings.create', 'notes.create', 'chat.internal', 'duty.log', 'panic.trigger'].includes(p)
  ),
  officer: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'officer.status.update',
      'gps.live', 'bolo.view', 'wanted.view', 'search.person', 'search.vehicle', 'search.plate', 'search.phone',
      'reports.incident', 'citations.create', 'warnings.create', 'notes.create', 'chat.internal', 'duty.log', 'panic.trigger'].includes(p)
  ),
  cadet: ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'chat.internal', 'duty.log', 'training.view'],
  dispatcher: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'units.manage', 'dispatch.view', 'dispatch.manage', 'dispatch.assign',
      'calls.911.view', 'calls.911.manage', 'calls.active.view', 'officer.status.update', 'gps.live', 'bolo.view',
      'wanted.view', 'chat.internal', 'announcements.broadcast', 'emergency.broadcast', 'analytics.view'].includes(p)
  ),
  detective: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'gps.track', 'bolo.view',
      'bolo.create', 'wanted.view', 'wanted.manage', 'warrants.view', 'warrants.create', 'search.person', 'search.vehicle',
      'search.plate', 'search.property', 'search.business', 'search.phone', 'search.identity', 'evidence.view',
      'evidence.create', 'evidence.manage', 'reports.crime', 'cases.view', 'cases.manage', 'investigation.timeline',
      'gangs.view', 'gangs.manage', 'organizations.view', 'notes.create', 'notes.view', 'chat.internal', 'court.request'].includes(p)
  ),
  swat: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'officer.status.update',
      'gps.live', 'gps.track', 'bolo.view', 'wanted.view', 'warrants.view', 'search.person', 'search.vehicle',
      'evidence.view', 'reports.incident', 'reports.arrest', 'roadblocks.deploy', 'spikes.deploy', 'panic.trigger',
      'emergency.broadcast', 'chat.internal', 'weapons.manage', 'equipment.manage'].includes(p)
  ),
  traffic: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'officer.status.update',
      'gps.live', 'search.vehicle', 'search.plate', 'citations.create', 'warnings.create', 'fines.calculate',
      'impound.manage', 'tow.request', 'reports.incident', 'chat.internal', 'duty.log', 'panic.trigger'].includes(p)
  ),
  air_support: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'calls.active.view', 'officer.status.update',
      'gps.live', 'gps.track', 'bolo.view', 'wanted.view', 'search.vehicle', 'search.plate', 'chat.internal',
      'duty.log', 'panic.trigger', 'vehicles.manage'].includes(p)
  ),
  investigation: POLICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'units.view', 'dispatch.view', 'gps.track', 'bolo.view', 'bolo.create',
      'wanted.view', 'wanted.manage', 'warrants.view', 'warrants.create', 'search.person', 'search.vehicle',
      'search.plate', 'search.property', 'search.business', 'search.phone', 'search.identity', 'search.weapon',
      'evidence.view', 'evidence.create', 'evidence.manage', 'evidence.locker', 'reports.crime', 'cases.view',
      'cases.manage', 'investigation.timeline', 'gangs.view', 'gangs.manage', 'organizations.view',
      'organizations.manage', 'notes.create', 'notes.view', 'chat.internal', 'court.request', 'audit.view'].includes(p)
  ),
};

export const POLICE_SOCKET_EVENTS = [
  'police:dispatch:new',
  'police:dispatch:update',
  'police:unit:update',
  'police:officer:status',
  'police:911:new',
  'police:panic',
  'police:bolo:new',
  'police:warrant:new',
  'police:case:update',
  'police:evidence:new',
  'police:chat:message',
  'police:announcement',
  'police:emergency:broadcast',
  'police:gps:update',
  'police:initialized',
] as const;
