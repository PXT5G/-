import { IdempotencyRecord } from '../database/models/IdempotencyRecord';
import { IDEMPOTENCY_TTL_MS } from '../constants/serviceAuth';

export interface IdempotencyResult<T> {
  hit: boolean;
  statusCode: number;
  body: T;
}

export async function getIdempotentResponse<T extends Record<string, unknown>>(
  key: string,
  method: string,
  path: string
): Promise<IdempotencyResult<T> | null> {
  const existing = await IdempotencyRecord.findOne({
    key,
    method: method.toUpperCase(),
    path,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!existing) return null;

  return {
    hit: true,
    statusCode: existing.statusCode,
    body: existing.responseBody as T,
  };
}

export async function storeIdempotentResponse(
  key: string,
  method: string,
  path: string,
  statusCode: number,
  responseBody: Record<string, unknown>
): Promise<void> {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
  await IdempotencyRecord.findOneAndUpdate(
    { key },
    {
      key,
      method: method.toUpperCase(),
      path,
      statusCode,
      responseBody,
      expiresAt,
    },
    { upsert: true, new: true }
  );
}

export async function purgeExpiredIdempotencyRecords(): Promise<number> {
  const result = await IdempotencyRecord.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount ?? 0;
}
