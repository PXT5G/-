/** GULF Justice — com.gulfos.justice constants */

export const JUSTICE_APP_BUNDLE = 'com.gulfos.justice' as const;

export const JUSTICE_ROLES = [
  'chief_judge',
  'judge',
  'magistrate',
  'prosecutor',
  'defense_attorney',
  'court_clerk',
  'bailiff',
  'court_admin',
] as const;

export type JusticeRole = (typeof JUSTICE_ROLES)[number];

export const JUSTICE_PERMISSIONS = [
  'mdt.access',
  'dashboard.view',
  'cases.view',
  'cases.manage',
  'cases.create',
  'cases.assign',
  'calendar.view',
  'calendar.manage',
  'hearings.view',
  'hearings.schedule',
  'hearings.manage',
  'trials.view',
  'trials.manage',
  'judges.view',
  'judges.manage',
  'prosecutors.view',
  'prosecutors.manage',
  'defense.view',
  'defense.manage',
  'clerks.view',
  'clerks.manage',
  'evidence.view',
  'evidence.create',
  'evidence.manage',
  'evidence.custody',
  'witnesses.view',
  'witnesses.manage',
  'charges.view',
  'charges.manage',
  'charges.file',
  'laws.view',
  'laws.manage',
  'sentences.view',
  'sentences.issue',
  'warrants.view',
  'warrants.approve',
  'warrants.revoke',
  'appeals.view',
  'appeals.manage',
  'search.citizen',
  'search.identity',
  'search.phone',
  'search.vehicle',
  'search.property',
  'search.business',
  'search.weapon',
  'search.case',
  'search.evidence',
  'search.report',
  'search.bank',
  'analytics.view',
  'subpoena.issue',
  'judgment.issue',
  'fines.issue',
  'prison.issue',
  'community_service.issue',
  'license.suspend',
  'courtrooms.view',
  'courtrooms.manage',
  'docket.view',
  'docket.manage',
  'arrest.approve',
  'search.approve',
  'citations.review',
  'realtime.courtroom',
  'chat.internal',
  'audit.view',
  'rbac.configure',
  'signatures.verify',
  'signatures.create',
] as const;

export type JusticePermission = (typeof JUSTICE_PERMISSIONS)[number];

export const OFFICIAL_STATUSES = ['on_duty', 'off_duty', 'in_court', 'in_chambers', 'unavailable'] as const;
export type OfficialStatus = (typeof OFFICIAL_STATUSES)[number];

export const CASE_STATUSES = ['pending', 'arraignment', 'pretrial', 'trial', 'sentencing', 'appealed', 'closed', 'dismissed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const HEARING_STATUSES = ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'] as const;
export type HearingStatus = (typeof HEARING_STATUSES)[number];

export const HEARING_TYPES = ['arraignment', 'pretrial', 'motion', 'sentencing', 'appeal', 'warrant', 'bail', 'status'] as const;
export type HearingType = (typeof HEARING_TYPES)[number];

export const TRIAL_STATUSES = ['scheduled', 'jury_selection', 'in_progress', 'deliberation', 'verdict', 'completed', 'mistrial'] as const;
export type TrialStatus = (typeof TRIAL_STATUSES)[number];

export const WARRANT_REVIEW_STATUSES = ['pending', 'approved', 'denied', 'expired'] as const;
export type WarrantReviewStatus = (typeof WARRANT_REVIEW_STATUSES)[number];

export const APPEAL_STATUSES = ['filed', 'under_review', 'hearing_scheduled', 'granted', 'denied', 'withdrawn'] as const;
export type AppealStatus = (typeof APPEAL_STATUSES)[number];

export const SENTENCE_TYPES = ['fine', 'prison', 'probation', 'community_service', 'license_suspension', 'combined'] as const;
export type SentenceType = (typeof SENTENCE_TYPES)[number];

export const EVIDENCE_TYPES = ['image', 'video', 'audio', 'file', 'document', 'gps', 'phone_record', 'communication_log', 'digital'] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const DEFAULT_JUSTICE_ROLE_PERMISSIONS: Record<JusticeRole, JusticePermission[]> = {
  chief_judge: [...JUSTICE_PERMISSIONS],
  judge: JUSTICE_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  magistrate: JUSTICE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'laws.manage', 'judges.manage', 'prosecutors.manage', 'defense.manage', 'clerks.manage'].includes(p)
  ),
  prosecutor: JUSTICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'cases.view', 'cases.manage', 'calendar.view', 'hearings.view', 'hearings.schedule',
      'trials.view', 'evidence.view', 'evidence.create', 'witnesses.view', 'witnesses.manage', 'charges.view', 'charges.manage',
      'charges.file', 'laws.view', 'sentences.view', 'warrants.view', 'appeals.view', 'search.citizen', 'search.identity',
      'search.phone', 'search.vehicle', 'search.property', 'search.business', 'search.weapon', 'search.case', 'search.evidence',
      'search.report', 'subpoena.issue', 'docket.view', 'citations.review', 'chat.internal', 'signatures.create'].includes(p)
  ),
  defense_attorney: JUSTICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'cases.view', 'calendar.view', 'hearings.view', 'trials.view', 'evidence.view',
      'witnesses.view', 'witnesses.manage', 'charges.view', 'laws.view', 'appeals.view', 'appeals.manage', 'search.citizen',
      'search.identity', 'search.phone', 'search.case', 'search.evidence', 'search.report', 'docket.view', 'chat.internal',
      'signatures.create'].includes(p)
  ),
  court_clerk: JUSTICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'cases.view', 'calendar.view', 'calendar.manage', 'hearings.view', 'hearings.schedule',
      'hearings.manage', 'trials.view', 'evidence.view', 'witnesses.view', 'charges.view', 'laws.view', 'warrants.view',
      'appeals.view', 'search.citizen', 'search.identity', 'search.phone', 'search.case', 'search.evidence', 'search.report',
      'courtrooms.view', 'docket.view', 'docket.manage', 'citations.review', 'chat.internal'].includes(p)
  ),
  bailiff: JUSTICE_PERMISSIONS.filter((p) =>
    ['mdt.access', 'dashboard.view', 'cases.view', 'hearings.view', 'trials.view', 'courtrooms.view', 'docket.view',
      'realtime.courtroom', 'chat.internal'].includes(p)
  ),
  court_admin: JUSTICE_PERMISSIONS.filter((p) => p !== 'rbac.configure' && !p.startsWith('sentences.') && !p.startsWith('judgment.')),
};

export const JUSTICE_SOCKET_EVENTS = [
  'justice:initialized',
  'justice:case:update',
  'justice:hearing:update',
  'justice:trial:update',
  'justice:evidence:update',
  'justice:warrant:review',
  'justice:appeal:update',
  'justice:judgment:issued',
  'justice:sentence:issued',
  'justice:courtroom:live',
  'justice:docket:update',
  'justice:notification',
  'justice:search:complete',
  'justice:subpoena:issued',
  'justice:citation:resolved',
] as const;
