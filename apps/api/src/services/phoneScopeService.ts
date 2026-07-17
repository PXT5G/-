import type { PhoneVerificationResult } from './characterPhoneService';

/** Resolves MongoDB query scope for character-isolated phone data */
export interface PhoneDataScope {
  userId?: string;
  phoneId?: string;
  characterRecordId?: string;
}

export function scopeFromVerification(result: PhoneVerificationResult): PhoneDataScope {
  return {
    userId: result.gulfosUserId,
    phoneId: result.phoneId,
    characterRecordId: result.characterRecordId,
  };
}

/** Builds a filter that prefers phoneId isolation when available */
export function phoneScopedFilter(scope: PhoneDataScope): Record<string, unknown> {
  if (scope.phoneId) {
    return { phoneId: scope.phoneId };
  }
  if (scope.userId) {
    return { userId: scope.userId };
  }
  return {};
}

/** Merges phone scope fields onto a document payload */
export function withPhoneScope<T extends Record<string, unknown>>(
  payload: T,
  scope: PhoneDataScope
): T & { phoneId?: string; characterRecordId?: string } {
  const out = { ...payload } as T & { phoneId?: string; characterRecordId?: string };
  if (scope.phoneId) out.phoneId = scope.phoneId;
  if (scope.characterRecordId) out.characterRecordId = scope.characterRecordId;
  return out;
}
